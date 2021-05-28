use dyn_sse_lib::*;
use indexing::*;
use multimap::*;
use std::collections::HashMap;
use std::io::*;

fn main() {
    // index data and create a plain-text index multi-map
    let mut plaintext_mm: MultiMap<String, String> = MultiMap::new();
    populate_multimap(
        &mut plaintext_mm,
        "../../test-docs/indexing-test-wiki",
        "wiki-articles-100.json",
        "single-thread-index",
        1,
        1000000000, /*1GB*/
    )
    .unwrap();

    let mut password = String::new();
    println!("Please enter your password.");
    stdin()
        .read_line(&mut password)
        .expect("error: unable to read user's password");

    let (prf_key, enc_key, mut emm, mut client_state) = construct_emm(password, &plaintext_mm);
    println!("Done constructing emm");

    loop {
        run_query(&prf_key, &enc_key, &mut client_state, &mut emm);
        run_update(&prf_key, &enc_key, &mut client_state, &mut emm);
        run_update(&prf_key, &enc_key, &mut client_state, &mut emm);
    }
}

fn run_query(
    prf_key: &[u8; 32],
    enc_key: &[u8; 32],
    client_state: &mut HashMap<String, (usize, usize, usize)>,
    emm: &mut HashMap<[u8; 32], Vec<u8>>,
) {
    let mut query = String::new();
    println!("Please enter your query.");
    stdin()
        .read_line(&mut query)
        .expect("error: unable to read user's query");
    let query = query.trim().to_string();
    let tokens = qtok(&prf_key, client_state, query.clone());
    let tok = match tokens {
        Some(tok) => tok,
        None => {
            println!("{:?}", "No key in MM!");
            return;
        }
    };
    let cts = get(&tok, emm);
    let ans = resolve_and_put_back(&enc_key, query, &tok, client_state, emm, &cts);
    for i in 0..ans.len() {
        println!("{:?}", ans[i]);
    }
}

fn run_update(
    prf_key: &[u8; 32],
    enc_key: &[u8; 32],
    client_state: &mut HashMap<String, (usize, usize, usize)>,
    emm: &mut HashMap<[u8; 32], Vec<u8>>,
) {
    let mut keyword = String::new();
    println!("Please enter your keyword to update.");
    stdin()
        .read_line(&mut keyword)
        .expect("error: unable to read user's input");
    let keyword = keyword.trim().to_string();
    let mut update_op = String::new();
    println!("Please enter 1 for add, 2 for delete and 3 for remove key operation");
    stdin()
        .read_line(&mut update_op)
        .expect("error: unable to read user's update op");
    let update_op = update_op.trim().to_string();
    let mut enum_op = Ops::Add;
    if update_op == "2" {
        enum_op = Ops::Del;
    } else if update_op == "3" {
        enum_op = Ops::RemKey;
    }
    let mut add_value = "0".to_string();
    if update_op != "3" {
        println!("Please enter the number of values to add. Enter 0 to skip.");
        stdin()
            .read_line(&mut add_value)
            .expect("error: unable to read user's input");
        add_value = add_value.trim().to_string();
    }
    let mut update_values: Option<Vec<String>> = None;
    let mut temp_vec = vec![];
    if add_value != "0" {
        for _i in 0..add_value.parse::<i32>().unwrap() {
            let mut val = String::new();
            println!("Please enter a value");
            stdin()
                .read_line(&mut val)
                .expect("error: unable to read user's update value");
            temp_vec.push(val.trim().to_string());
            println!("{}", val.trim().to_string());
        }
        update_values = Some(temp_vec);
    }

    let utoken = utok(
        &prf_key,
        &enc_key,
        client_state,
        build_update(keyword, update_values, enum_op),
    );
    put(utoken, emm);
    println!("{:?}", "Update Done");
}
