# share

Research prototype for the SHARE project.

## Build Instructions

_These build instructions have been tested with [Java SE](https://www.oracle.com/java/technologies/javase-downloads.html#JDK15) 15.0.1 and [Maven](https://maven.apache.org/) 3.6.3._

The following commands will download the `share` repository and attempt to build it using Maven:

```bash
git clone https://github.com/ZacharyEspiritu/share.git
cd share/java
mvn package
```

This should produce a `target/share-1.0-SNAPSHOT.jar` file in the repository. If this file exists, the build was successful.

```
nodemon server.js
nodemon oprf-service.js
node party-script.js ANALYST INIT
node party-script.js DATAOWNER SETUP 1

```
