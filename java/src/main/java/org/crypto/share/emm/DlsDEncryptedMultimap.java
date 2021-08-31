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

package org.crypto.share.emm;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * DlsD implementation of an encrypted multimap. Based on DlsD.java from the Clusion library
 * (https://github.com/encryptedsystems/Clusion/blob/master/src/main/java/org/crypto/sse/DlsD.java)
 * with some practical modifications for the client-server model.
 */
public class DlsDEncryptedMultimap {

    /**
     * The initial value for the `currentGlobalVersion`.
     */
    public static final int INITIAL_GLOBAL_VERSION = 1;

    /**
     * The initial value that newly initialized VersionCounters start at; used when adding new
     * labels to the oldVersionCounters and newVersionCounters dictionaries.
     *
     * An invariant is that the current counter value always represents the "last used up"
     * counter. Thus, INITIAL_COUNTER_VALUE should never be used by any key-value pair (since new
     * labels should start generating at INITIAL_COUNTER_VALUE + 1).
     */
    public static final int INITIAL_COUNTER_VALUE = 0;

    // ConcurrentHashMap is used to allow for easy concurrent read-write access to both
    // dictionaries. No `synchronized` keyword is required when accessing these dictionaries.
    private @Nonnull final ConcurrentHashMap<String, byte[]> oldDictionary;
    private @Nonnull final ConcurrentHashMap<String, byte[]> newDictionary;

    private @Nonnull final Set<String> previouslySearchedLabels;

    private int currentGlobalVersion;
    private @Nonnull final ConcurrentHashMap<String, VersionCounter> oldVersionCounters;
    private @Nonnull final ConcurrentHashMap<String, VersionCounter> newVersionCounters;

    public DlsDEncryptedMultimap() {
        this(new ConcurrentHashMap<>(),
             new ConcurrentHashMap<>(),
             INITIAL_GLOBAL_VERSION,
             Collections.synchronizedSet(new HashSet<>()),
             new ConcurrentHashMap<>(),
             new ConcurrentHashMap<>());
    }

    public DlsDEncryptedMultimap(
            final ConcurrentHashMap<String, byte[]> oldDictionary,
            final ConcurrentHashMap<String, byte[]> newDictionary,
            int currentGlobalVersion,
            final Set<String> previouslySearchedLabels,
            final ConcurrentHashMap<String, VersionCounter> oldVersionCounters,
            final ConcurrentHashMap<String, VersionCounter> newVersionCounters) {
        this.oldDictionary = oldDictionary;
        this.newDictionary = newDictionary;
        this.currentGlobalVersion = currentGlobalVersion;
        this.previouslySearchedLabels = previouslySearchedLabels;
        this.oldVersionCounters = oldVersionCounters;
        this.newVersionCounters = newVersionCounters;
    }

    public int getCurrentGlobalVersion() {
        return currentGlobalVersion;
    }

    public VersionCounter getNewVersionCounterForLabel(String label) {
        return getVersionCounterFromDictionary(label, newVersionCounters);
    }

    public VersionCounter getOldVersionCounterForLabel(String label) {
        return getVersionCounterFromDictionary(label, oldVersionCounters);
    }

    private VersionCounter getVersionCounterFromDictionary(
            final String label,
            final ConcurrentHashMap<String, VersionCounter> dictionary) {
        final VersionCounter defaultCounter = new VersionCounter(currentGlobalVersion,
                                                                 INITIAL_COUNTER_VALUE);
        final @Nullable VersionCounter actualCounter = dictionary.putIfAbsent(label,
                                                                              defaultCounter);

        // `putIfAbsent` returns null if defaultCounter was inserted.
        if (actualCounter == null) {
            return defaultCounter;
        } else {
            return actualCounter;
        }
    }

    public void setVersionCounterForLabel(String label,
                                          VersionCounter versionCounter) {
        newVersionCounters.put(label, versionCounter);
    }

    public void update(final UpdateToken updateToken) {
        newDictionary.put(updateToken.getLabel(), updateToken.getValue());
    }

    public void updateMultiple(final HashMap<String, byte[]> updateToken) {
        newDictionary.putAll(updateToken);
    }

    public List<byte[]> query(final SearchToken searchToken) {
        List<byte[]> result = querySubtokens(searchToken.getOldSubtokens(), oldDictionary);
        result.addAll(querySubtokens(searchToken.getNewSubtokens(), newDictionary));
        return result;
    }

    private List<byte[]> querySubtokens(
            final Collection<String> subtokenVector,
            final ConcurrentHashMap<String, byte[]> dictionaryToQuery) {
        // Pre-allocating the size of the ArrayList by specifying subtokenVector.length is
        // a performance optimization.
        List<byte[]> result = new ArrayList<>(subtokenVector.size());
        for (final String subtoken : subtokenVector) {
            byte[] value = dictionaryToQuery.get(subtoken);
            if (value != null) {
                result.add(value);
            }
        }
        return result;
    }
}
