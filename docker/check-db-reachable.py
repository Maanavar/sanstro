"""Confirm the test database is reachable from inside this container.

Run by test-docker.ps1 before pytest. A run against nothing, or against the
wrong port, must fail loudly rather than look like a pass -- and on Docker
Desktop the relevant failure is specific: `--network host` joins the container
to the Linux VM's network namespace, so outbound to the host's published 5433
works while a port the container LISTENS on is unreachable from Windows. If
host networking is ever turned off in Docker Desktop, this is what notices.

Takes host and port as arguments. Lives in a file rather than inline because
PS 5.1 mangles embedded double quotes when handing a string to a native exe --
see the dependency-drift gate, whose first inline version died with a
SyntaxError and reported clean.

Exit 0 = reachable, 1 = not.
"""

from __future__ import annotations

import socket
import sys


def main() -> int:
    if len(sys.argv) != 3:
        print(f"usage: {sys.argv[0]} <host> <port>", file=sys.stderr)
        return 1
    host, port_text = sys.argv[1], sys.argv[2]
    try:
        port = int(port_text)
    except ValueError:
        print(f"not a port: {port_text!r}", file=sys.stderr)
        return 1

    sock = socket.socket()
    sock.settimeout(5)
    try:
        sock.connect((host, port))
    except OSError as exc:
        print(f"{host}:{port} unreachable from the container: {exc!r}", file=sys.stderr)
        return 1
    finally:
        sock.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
