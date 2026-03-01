FROM node:20-slim

# Set non-interactive timezone and env
ENV TZ=Asia/Tokyo
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

# Install essential tools directly using apt-get
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    bash \
    curl \
    ca-certificates \
    openssh-client \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install Supabase CLI via direct .deb download to bypass npm deprecation and script errors
RUN curl -sL https://github.com/supabase/cli/releases/download/v1.223.10/supabase_1.223.10_linux_amd64.deb -o supabase.deb \
    && dpkg -i supabase.deb \
    && rm supabase.deb

# Allow the node user to use sudo without password (helpful for devcontainers)
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Set the default user
USER node
WORKDIR /workspace
