# Fetch the LiteFS binary using a multi-stage build.
FROM flyio/litefs:0.2 AS litefs

# Our final Docker image stage starts here.
FROM jarredsumner/bun:edge
RUN apk add bash curl fuse

WORKDIR /app

# Copy binaries from the previous build stages.
COPY . .
RUN bun install

COPY --from=litefs /usr/local/bin/litefs /usr/local/bin/litefs

# Copy our LiteFS configuration.
ADD etc/litefs.yml /etc/litefs.yml

# Ensure our mount & data directories exists before mounting with LiteFS.
RUN mkdir -p /data /mnt/sqlite

# Run LiteFS as the entrypoint so it can execute "litefs-example" as a subprocess.
ENTRYPOINT "litefs"
