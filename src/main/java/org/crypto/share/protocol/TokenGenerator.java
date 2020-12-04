package org.crypto.share.protocol;

import com.google.protobuf.ByteString;
import org.crypto.share.emm.DlsDEncryptedMultimap;
import org.crypto.share.emm.UpdateType;
import org.crypto.sse.CryptoPrimitives;

import javax.crypto.NoSuchPaddingException;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class TokenGenerator {

    private static final int IV_SIZE = 16;
    private static final int FILE_NAME_SIZE = 0;

    public ByteString generateLabelToken(final byte[] labelKey, final String label,
                                         final Integer counter)
            throws UnsupportedEncodingException {
        final String concatenated = label + counter;
        byte[] hmac = CryptoPrimitives.generateHmac(labelKey, concatenated);
        return ByteString.copyFrom(hmac);
    }

    // generateSearchTokens
    public List<ByteString> generateLabelTokens(final byte[] labelKey, final String label,
                                                final Integer startInclusive,
                                                final Integer endExclusive)
            throws UnsupportedEncodingException {
        int numLabels = endExclusive - startInclusive;
        final List<ByteString> result = new ArrayList<>(numLabels);

        for (int i = startInclusive; i < endExclusive; i++) {
            result.add(generateLabelToken(labelKey, label, i));
        }
        return result;
    }

    public ByteString generateValueToken(final byte[] valueKey, final String value,
                                         final UpdateType operation)
            throws InvalidAlgorithmParameterException, NoSuchAlgorithmException,
                   NoSuchPaddingException, NoSuchProviderException, InvalidKeyException,
                   IOException {
        final String messageToEncrypt = value + operation.toString();
        final byte[] ivBytes = CryptoPrimitives.randomBytes(IV_SIZE);
        final byte[] valueSubtoken = CryptoPrimitives.encryptAES_CTR_String(
                valueKey, ivBytes, messageToEncrypt, FILE_NAME_SIZE);
        return ByteString.copyFrom(valueSubtoken);
    }

    public UpdateToken<String, String> generateUpdateToken(byte[] labelKey, byte[] valueKey,
                                                           String label, String value,
                                                           UpdateType operation,
                                                           Integer counter)
            throws IOException, InvalidAlgorithmParameterException, NoSuchAlgorithmException,
                   NoSuchPaddingException, NoSuchProviderException, InvalidKeyException {
        ByteString labelSubtoken = generateLabelToken(labelKey, label, counter);
        ByteString valueSubtoken = generateValueToken(valueKey, value, operation);
        return new UpdateToken<>(labelSubtoken.toString(), valueSubtoken.toString());
    }
}
