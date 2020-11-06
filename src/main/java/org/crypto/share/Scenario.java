/**
 * Copyright 2020, Brown University, Providence, RI.
 *
 *                         All Rights Reserved
 *
 * Permission to use, copy, modify, and distribute this software and
 * its documentation for any purpose other than its incorporation into a
 * commercial product or service is hereby granted without fee, provided
 * that the above copyright notice appear in all copies and that both
 * that copyright notice and this permission notice appear in supporting
 * documentation, and that the name of Brown University not be used in
 * advertising or publicity pertaining to distribution of the software
 * without specific, written prior permission.
 *
 * BROWN UNIVERSITY DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE,
 * INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR ANY
 * PARTICULAR PURPOSE.  IN NO EVENT SHALL BROWN UNIVERSITY BE LIABLE FOR
 * ANY SPECIAL, INDIRECT OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

package org.crypto.share;

import com.google.common.collect.ArrayListMultimap;
import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Multimap;
import org.crypto.share.emm.DlsDEncryptedMultimap;
import org.crypto.sse.CryptoPrimitives;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.spec.InvalidKeySpecException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Hello world!
 *
 */
public class Scenario
{

    static final String PURPOSE_COUNTER_KEY = "counter";
    static final String PURPOSE_LABEL_KEY = "prf";
    static final String PURPOSE_VALUE_KEY = "aes";

    static final ImmutableList<String> KEY_GEN_PURPOSES = ImmutableList.of(PURPOSE_COUNTER_KEY,
                                                                           PURPOSE_LABEL_KEY,
                                                                           PURPOSE_VALUE_KEY);
    static final int KEY_GEN_ITERATION_COUNT = 100;
    static final int KEY_GEN_KEY_SIZE = 128;

    public static void main(String[] args) throws Exception {
        BufferedReader keyRead = new BufferedReader(new InputStreamReader(System.in));
        System.out.println("Enter a seed for key generation:");
        final String password = keyRead.readLine();
        final PrivateKey privateKey = generatePrivateKey(password);

        System.out.println("Enter number of concurrent DataOwners:");
        final int numOwners = Integer.parseInt(keyRead.readLine());

        System.out.println("Run DataOwners concurrently? (Y/n):");
        final boolean useThreads = keyRead.readLine().equalsIgnoreCase("y");

        // Set up initial EMM (this is just what DlsD.constructEMMParGMM,
        // except on an empty multimap):
        System.out.println("Initializing EMM...");
        DlsDEncryptedMultimap emm = new DlsDEncryptedMultimap();

        // Set up the parties:
        System.out.println("Initializing parties...");
        Server server = new Server(emm);
        Analyst analyst = new Analyst(privateKey, server);

        // Set up variable number of DataOwners:
        List<DataOwner> dataOwners = new ArrayList<DataOwner>();
        for (int i = 0; i < numOwners; i++) {
            dataOwners.add(new DataOwner(privateKey, server));
        }

        // Start some threads for the owners to add data:
        if (useThreads) {
            System.out.println("Having owners add data concurrently...");
            int threadCount = dataOwners.size();
            if (threadCount > Runtime.getRuntime().availableProcessors()) {
                threadCount = Runtime.getRuntime().availableProcessors();
            }

            ExecutorService service = Executors.newFixedThreadPool(threadCount);
            for (final DataOwner dataOwner : dataOwners) {
                Callable<Void> callable = new Callable<Void>() {
                    public Void call() throws Exception {
                        System.out.println("  DataOwner: starting updates...");
                        Multimap<String, String> map = ArrayListMultimap.create();
                        ArrayList<String> values = new ArrayList<>();
                        values.add("rand1");
                        values.add("rand2");
                        map.putAll("data1", values);
                        dataOwner.updateServerWithMultimap(map);
                        System.out.println("  DataOwner: done.");
                        return null;
                    }
                };
                service.submit(callable);
            }

            shutdownAndAwaitTermination(service);
        } else {
            System.out.println("Having owners add data non-concurrently...");
            for (final DataOwner dataOwner : dataOwners) {
                Multimap<String, String> map = ArrayListMultimap.create();
                ArrayList<String> values = new ArrayList<>();
                values.add("rand1");
                values.add("rand2");
                map.putAll("data1", values);
                dataOwner.updateServerWithMultimap(map);
                System.out.println("DataOwner: done.");
            }
        }
        System.out.println("DataOwner phase done.");

        // Query:
        System.out.println("Querying...");
        System.out.println(analyst.filter("data1"));
    }

    private static PrivateKey generatePrivateKey(String password)
            throws InvalidKeySpecException, NoSuchAlgorithmException, NoSuchProviderException {
        ImmutableMap.Builder<String, byte[]> immutableMap = ImmutableMap.<String, byte[]>builder();
        for (final String purpose : KEY_GEN_PURPOSES) {
            immutableMap.put(purpose, CryptoPrimitives.keyGenSetM(password, purpose.getBytes(),
                                                                  KEY_GEN_ITERATION_COUNT,
                                                                  KEY_GEN_KEY_SIZE));
        }
        ImmutableMap<String, byte[]> keys = immutableMap.build();
        return new PrivateKey(keys.get(PURPOSE_COUNTER_KEY), keys.get(PURPOSE_LABEL_KEY),
                                   keys.get(PURPOSE_VALUE_KEY));
    }

    /**
     * Safely wait for all pool threads to terminate.
     * @param pool
     */
    private static void shutdownAndAwaitTermination(ExecutorService pool) {
        pool.shutdown(); // Disable new tasks from being submitted
        try {
            // Wait a while for existing tasks to terminate
            if (!pool.awaitTermination(60, TimeUnit.SECONDS)) {
                pool.shutdownNow(); // Cancel currently executing tasks
                // Wait a while for tasks to respond to being cancelled
                if (!pool.awaitTermination(60, TimeUnit.SECONDS))
                    System.err.println("Pool did not terminate");
            }
        } catch (InterruptedException ie) {
            // (Re-)Cancel if current thread also interrupted
            pool.shutdownNow();
            // Preserve interrupt status
            Thread.currentThread().interrupt();
        }
    }
}
