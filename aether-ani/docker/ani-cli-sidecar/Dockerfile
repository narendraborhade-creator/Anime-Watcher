FROM alpine:3.20

# Hardened fallback container running unmodified pystardust/ani-cli + curl-impersonate
# Reference: https://github.com/pystardust/ani-cli/discussions/1465
RUN apk add --no-cache \
    bash \
    curl \
    grep \
    sed \
    fzf \
    git \
    patch \
    ffmpeg \
    ca-certificates

RUN adduser -D -u 10001 anicli
USER anicli
WORKDIR /home/anicli

COPY --chown=anicli:anicli healthcheck.sh /home/anicli/healthcheck.sh
RUN chmod +x /home/anicli/healthcheck.sh

HEALTHCHECK --interval=60s --timeout=10s --retries=3 CMD ["/home/anicli/healthcheck.sh"]
CMD ["sh", "-c", "while true; do sleep 3600; done"]
