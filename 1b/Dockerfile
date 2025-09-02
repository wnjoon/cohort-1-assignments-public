FROM ghcr.io/foundry-rs/foundry:latest

# Switch to root to install packages
USER root

# Install curl and other useful packages
RUN apt-get update && apt-get install -y \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Switch back to the original user
USER foundry

# Set bash as the default shell
SHELL ["/bin/bash", "-c"]
