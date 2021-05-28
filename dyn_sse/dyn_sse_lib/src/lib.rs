#[macro_use]
extern crate arrayref;

use multimap::*;
use openssl::rand::rand_bytes;
use openssl::symm::{decrypt, encrypt, Cipher};
use ring::hmac;
use ring::{digest, pbkdf2};
use std::collections::HashMap;
use std::num::NonZeroU32;

static PBKDF2_ALG: pbkdf2::Algorithm = pbkdf2::PBKDF2_HMAC_SHA512;
const MASTER_KEY_LEN: usize = digest::SHA512_OUTPUT_LEN;

/*constant used to pad or truncate values before encryption*/
const MAX_VALUE_SIZE: usize = 40000; //bytes
const EXPIRY_LEN: usize = 2; // bytes

/*struct for query token*/
pub struct Qtok {
    tk0: [u8; 32],
    tk1: [u8; 32],
    count0: usize,
    count1: usize,
}

pub struct Utok {
    label: [u8; 32],
    value: Vec<u8>,
}

// /*struct and enum for updates*/
#[derive(PartialEq)]
pub enum Ops {
    Add,
    Del,
    RemKey,
}

pub struct Update {
    pub key: String,
    pub values: Option<Vec<String>>, // value must exist if op is add or del
    pub op: Ops,                     // add key, values or del key,values or remove key
}

// pub struct EMM_Value {
//     pub expiry_time: String,
//     pub values: Vec<u8>
// }

pub fn build_update(key: String, values: Option<Vec<String>>, op: Ops) -> Update {
    // correct receipts going into mm
    // println!("Update! {:?}", values);

    Update {
        key: key,
        values: values,
        op: op,
    }
}

/*setup algorithm*/
pub fn construct_emm(
    password: String,
    // expiry: String, // CHANGE FOR EVERY INPUT
    input_mm: &MultiMap<String, String>,
    expiry_flag: bool
) -> (
    [u8; 32],
    [u8; 32],
    HashMap<[u8; 32], Vec<u8>>,
    // HashMap<[u8; 32], EMM_Value>,
    HashMap<String, (usize, usize, usize)>,
) {
    // create keys
    let mut master_key = [0u8; MASTER_KEY_LEN];
    // Normally these parameters would be loaded from a configuration file. \\THIS IS TEMPORARY.
    let pbkdf2_iterations = NonZeroU32::new(100_000).unwrap();
    let salt = [
        // This value needs to be generated from a secure PRNG \\CHANGE.
        0xd6, 0x26, 0x98, 0xda, 0xf4, 0xdc, 0x50, 0x52, 0x24, 0xf2, 0x27, 0xd1, 0xfe, 0x39, 0x01,
        0x8a,
    ];
    pbkdf2::derive(
        PBKDF2_ALG,
        pbkdf2_iterations,
        &salt,
        password.as_bytes(),
        &mut master_key,
    );
    let (enc_key, prf_key) = master_key.split_at_mut(32);
    let enc_key = array_ref!(&enc_key, 0, 32);
    let prf_key = array_ref!(&prf_key, 0, 32);
    // create client state to keep counter
    let mut client_state: HashMap<String, (usize, usize, usize)> = HashMap::new(); /*count of old values, version num for FP updates, count of unresolved updates*/
    // create emm
    let mut emm: HashMap<[u8; 32], Vec<u8>> = HashMap::new();
    // let mut emm: HashMap<[u8; 32], EMM_Value> = HashMap::new();


    for (key, _) in input_mm.iter() {
        // generate a word specific prf key
        let mut labels_key: [u8; 32] = [0; 32];
        generate_hmac(
            prf_key,
            format! {"{}{}{}",key,"||",0}.to_string(),
            &mut labels_key,
        );
        let value_vec = input_mm.get_vec(key).unwrap();
        for i in 0..value_vec.len() {
            let mut prf_output: [u8; 32] = [0; 32];
            //gen label
            generate_hmac(&labels_key, i.to_string(), &mut prf_output);
            // gen cipher
            let value = format_v_for_enc("+", value_vec[i].to_string());
            let cipher_text = aes_ctr_encrypt(enc_key, value);
            //insert label, cipher
            // let emm_val = EMM_Value {
            //     expiry_time: expiry.clone(),
            //     values: cipher_text
            // };
            // emm.insert(prf_output, emm_val);
            // if expiry_flag {
            //     // cipher_text.push(b'A');
            //     // cipher_text.push(b'B');
            //     println!("added expiry!!");

            // } 

     
            // println!("len: {}", cipher_text.clone().len());

            emm.insert(prf_output, cipher_text);
     
        }
        // update client state
        let count = value_vec.len();
        client_state.insert(key.to_string(), (count, 1, 0));
    }
    (*prf_key, *enc_key, emm, client_state)
}

pub fn generate_labels(
    prf_key: [u8;32],
    input: String
) -> ([u8;32]) {

    let prf_key = array_ref!(&prf_key, 0, 32);
    let mut labels_key: [u8; 32] = [0; 32];
    generate_hmac(
        prf_key,
        format! {"{}{}{}",input,"||",0}.to_string(),
        &mut labels_key,
    );
    let mut prf_output: [u8; 32] = [0; 32];
    generate_hmac(&labels_key, "0".to_string(), &mut prf_output);

    prf_output
}


fn format_v_for_enc(op: &str, mut val: String) -> String {
    if val.len() > (MAX_VALUE_SIZE - 4) {
        let mut end = MAX_VALUE_SIZE - 4;
        while !val.is_char_boundary(end) {
            end -= 1;
        }
        val = (val[..end]).to_string();
    }
    let temp: String = String::from_utf8(vec![b'\t'; MAX_VALUE_SIZE - val.len() - 1]).unwrap();
    val.push_str(&temp);
    val.push_str(op);
    val
}

/*token algorithm*/
pub fn qtok(
    prf_key: &[u8; 32],
    state: &mut HashMap<String, (usize, usize, usize)>,
    query: String,
) -> Option<Qtok> {
    let mut qtok = None;
    if state.contains_key(&query) {
        let (old_count, version, new_count) = *(state.get(&query).unwrap());

        let mut tk0: [u8; 32] = [0; 32];
        let query_0 = format! {"{}{}{}",query,"||",0};
        generate_hmac(prf_key, query_0, &mut tk0);

        let mut tk1: [u8; 32] = [0; 32];
        let query_1 = format! {"{}{}{}",query,"||",version};
        generate_hmac(prf_key, query_1, &mut tk1);

        // update version number and new_count. We update fix old count during resolve/putback
        state.insert(query, (old_count, version + 1, 0));

        qtok = Some(Qtok {
            tk0: tk0,
            tk1: tk1,
            count0: old_count,
            count1: new_count,
        });
    }
    qtok
}

/*server function to query emm*/
pub fn get(qtok: &Qtok, emm: &mut HashMap<[u8; 32], Vec<u8>>) -> (Vec<Vec<u8>>, Vec<Vec<u8>>) {
    let mut res: Vec<Vec<u8>> = Vec::new();
    let mut upd_res: Vec<Vec<u8>> = Vec::new();
    for i in 0..qtok.count0 {
        let mut label: [u8; 32] = [0; 32];
        generate_hmac(&qtok.tk0, i.to_string(), &mut label);
        let temp = emm.remove(&label).unwrap();
        res.push(temp.to_vec());
    }
    for i in 0..qtok.count1 {
        let mut label: [u8; 32] = [0; 32];
        generate_hmac(&qtok.tk1, i.to_string(), &mut label);
        let temp = emm.remove(&label).unwrap();
        upd_res.push(temp.to_vec());
    }
    (res, upd_res)
}


/*executed by client; resolve and return encrypted values to client and put_back the resolved encrypted values to the server*/
pub fn resolve_and_put_back(
    enc_key: &[u8; 32],
    query: String,
    qtok: &Qtok,
    state: &mut HashMap<String, (usize, usize, usize)>,
    emm: &mut HashMap<[u8; 32], Vec<u8>>,
    values: &(Vec<Vec<u8>>, Vec<Vec<u8>>),
) -> Vec<String> {
    let mut ans: Vec<String> = Vec::new();
    let (old_vals, new_vals) = values;
    for i in 0..old_vals.len() {
        let mut vec =  old_vals[i].to_vec();

        // TODO:
        if vec.len() >= MAX_VALUE_SIZE + EXPIRY_LEN + 16 {
            println!("meeep: {}", vec[40016]);

            vec.drain(40016..40018);
        }

        // println!("old vals lens: {}", vec.len());
        // let plaintext = aes_ctr_decrypt(enc_key, old_vals[i].to_vec());
        let plaintext = aes_ctr_decrypt(enc_key, vec);

        // println!("Plaintext len: {}", plaintext.clone().len());
        let l = plaintext.clone().len();

        let plaintext = String::from_utf8_lossy(&plaintext).into_owned();

        if l == (MAX_VALUE_SIZE + EXPIRY_LEN) {
            println!("plaintext: {}", plaintext.clone());

        }
        
        let tokens: Vec<&str> = plaintext.split("\t").collect();
        ans.push(tokens[0].to_string());
    }
    for i in 0..new_vals.len() {
        let plaintext = aes_ctr_decrypt(enc_key, new_vals[i].to_vec());
        let plaintext = String::from_utf8_lossy(&plaintext).into_owned();
        let tokens: Vec<&str> = plaintext.split("\t").collect();
        let value = tokens[0].to_string();
        let tag = tokens[tokens.len() - 1].to_string();
        if tag == "*" {
            ans.clear();
        } else if tag == "-" {
            ans.retain(|x| *x != value);
        } else {
            ans.push(value);
        }
    }
    //update state old_count
    let (_, v, _) = state.get(&query).unwrap();
    let version = *v;
    state.insert(query, (ans.len(), version, 0));
    //put back resolved values
    let encrypted_vals = re_encrypt_values(enc_key, &ans);
    put_back(qtok.tk0, encrypted_vals, emm);
    ans
}




/*executed by client; resolve and return encrypted values to client and put_back the resolved encrypted values to the server*/
pub fn remove_keyword(
    enc_key: &[u8; 32],
    keyword: String,
    qtok: &Qtok,
    state: &mut HashMap<String, (usize, usize, usize)>,
    emm: &mut HashMap<[u8; 32], Vec<u8>>,
    values: &(Vec<Vec<u8>>, Vec<Vec<u8>>),
) -> Vec<String> {
    let mut ans: Vec<String> = Vec::new();
    let (old_vals, new_vals) = values;
    for i in 0..old_vals.len() {
        let mut vec =  old_vals[i].to_vec();

        // TODO: 
        if vec.len() >= MAX_VALUE_SIZE + EXPIRY_LEN + 16 {
            println!("meeep: {}", vec[40016]);

            vec.drain(40016..40018);
        }

        println!("old vals lens: {}", vec.len());
        // let plaintext = aes_ctr_decrypt(enc_key, old_vals[i].to_vec());
        let plaintext = aes_ctr_decrypt(enc_key, vec);

        println!("Plaintext len: {}", plaintext.clone().len());
        let l = plaintext.clone().len();

        let plaintext = String::from_utf8_lossy(&plaintext).into_owned();

        if l == (MAX_VALUE_SIZE + EXPIRY_LEN) {
            println!("plaintext: {}", plaintext.clone());

        }
        
        let tokens: Vec<&str> = plaintext.split("\t").collect();
        ans.push(tokens[0].to_string());
    }
    // for i in 0..new_vals.len() {
    //     let plaintext = aes_ctr_decrypt(enc_key, new_vals[i].to_vec());
    //     let plaintext = String::from_utf8_lossy(&plaintext).into_owned();
    //     let tokens: Vec<&str> = plaintext.split("\t").collect();
    //     let value = tokens[0].to_string();
    //     let tag = tokens[tokens.len() - 1].to_string();
    //     if tag == "*" {
    //         ans.clear();
    //     } else if tag == "-" {
    //         ans.retain(|x| *x != value);
    //     } else {
    //         ans.push(value);
    //     }
    // }
    // //update state old_count
    // let (_, v, _) = state.get(&keyword).unwrap();
    // let version = *v;
    // state.insert(query, (ans.len(), version, 0));
    // //put back resolved values
    // let encrypted_vals = re_encrypt_values(enc_key, &ans);
    // put_back(qtok.tk0, encrypted_vals, emm);
    ans
}





/* server function to put back resolved values in the emm*/
pub fn put_back(utok: [u8; 32], values: Vec<Vec<u8>>, emm: &mut HashMap<[u8; 32], Vec<u8>>) {
    for i in 0..values.len() {
        let mut label: [u8; 32] = [0; 32];
        generate_hmac(&utok, i.to_string(), &mut label);
        emm.insert(label, values[i].clone());
    }
}

/*update token algorithm*/
pub fn utok(
    prf_key: &[u8; 32],
    enc_key: &[u8; 32],
    state: &mut HashMap<String, (usize, usize, usize)>,
    update: Update,
) -> Vec<Utok> {
    if !state.contains_key(&update.key) {
        state.insert(update.key.clone(), (0, 1, 0));
    }
    let (old_count, version, new_count) = *(state.get(&update.key).unwrap());
    let mut tk1: [u8; 32] = [0; 32];
    let word_with_version = format! {"{}{}{}",update.key,"||",version};
    generate_hmac(prf_key, word_with_version, &mut tk1);
    let mut to_return: Vec<Utok> = Vec::new();

    if update.op == Ops::RemKey {
        // gen label
        let mut label: [u8; 32] = [0; 32];
        generate_hmac(&tk1, new_count.to_string(), &mut label);
        // gen cipher
        let value = format_v_for_enc("*", "".to_string());
        let cipher_text = aes_ctr_encrypt(enc_key, value);
        to_return.push(Utok {
            label: label,
            value: cipher_text,
        });
        // update version number and new_count. We update fix old count during resolve/putback
        state.insert(update.key, (old_count, version, new_count + 1));
    } else {
        let update_values = update.values.unwrap();
        for i in 0..update_values.len() {
            // gen label
            let mut label: [u8; 32] = [0; 32];
            generate_hmac(&tk1, (new_count + i).to_string(), &mut label);
            // gen cipher
            let value;
            if update.op == Ops::Del {
                value = format_v_for_enc("-", update_values[i].to_string());
            } else {
                value = format_v_for_enc("+", update_values[i].to_string());
            }
            let cipher_text = aes_ctr_encrypt(enc_key, value);
            to_return.push(Utok {
                label: label,
                value: cipher_text,
            });
        }
        state.insert(
            update.key,
            (old_count, version, new_count + update_values.len()),
        );
    }

    to_return
}
/* server function to put updates in the emm*/
pub fn put(utok: Vec<Utok>, emm: &mut HashMap<[u8; 32], Vec<u8>>) {
    for i in 0..utok.len() {
        // println!("len: {}", utok[i].value.clone().len());
        emm.insert(utok[i].label, utok[i].value.clone());
    }
}

/*re-encrypt values*/
fn re_encrypt_values(enc_key: &[u8; 32], values: &Vec<String>) -> Vec<Vec<u8>> {
    let mut encryptions: Vec<Vec<u8>> = Vec::new();
    for i in 0..values.len() {
        encryptions.push(aes_ctr_encrypt(enc_key, values[i].clone()));
    }
    encryptions
}

/*Crypto Helper Functions*/
fn generate_hmac(key: &[u8; 32], msg: String, output: &mut [u8; 32]) {
    (*output).copy_from_slice(
        &(hmac::sign(&hmac::Key::new(hmac::HMAC_SHA256, key), msg.as_bytes()).as_ref())[0..32],
    );
}

//string encrypt
fn aes_ctr_encrypt(key: &[u8; 32], data: String) -> Vec<u8> {
    let cipher = Cipher::aes_256_ctr();
    let mut iv = [0; 16];
    rand_bytes(&mut iv).unwrap();
    let cipher_text = encrypt(cipher, key, Some(&iv[..]), data.as_bytes()).unwrap();
    [&iv[..], &cipher_text[..]].concat()
}

fn aes_ctr_decrypt(key: &[u8; 32], cipher_text: Vec<u8>) -> Vec<u8> {
    let cipher = Cipher::aes_256_ctr();
    decrypt(cipher, key, Some(&cipher_text[0..16]), &cipher_text[16..]).unwrap()
}
