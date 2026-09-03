#!/usr/bin/env python3
"""
Script to help migrate error messages to use the centralized error handling system.

This script:
1. Finds all HTTPException raises in the codebase
2. Maps them to appropriate ErrorCode values
3. Suggests the necessary changes
4. Can optionally apply the changes automatically

Usage:
    python scripts/migrate-error-messages.py --report    # Show what needs to be updated
    python scripts/migrate-error-messages.py --migrate    # Apply changes (caution!)
"""

import re
import sys
from pathlib import Path
from typing import Optional

# Error code mapping - map error messages to ErrorCode values
ERROR_CODE_MAP = {
    # 404 - Not Found
    r"birth profile not found": "BIRTH_PROFILE_NOT_FOUND",
    r"chart not found": "CHART_NOT_FOUND",
    r"family vault not found": "FAMILY_VAULT_NOT_FOUND",
    r"family member not found": "FAMILY_MEMBER_NOT_FOUND",
    r"user.*not found": "USER_NOT_FOUND",
    r"journal entry not found": "JOURNAL_ENTRY_NOT_FOUND",
    r"goal not found": "GOAL_NOT_FOUND",
    r"feedback not found": "FEEDBACK_NOT_FOUND",
    r".*not found": "RESOURCE_NOT_FOUND",

    # 403 - Forbidden
    r"access denied": "ACCESS_DENIED",
    r"permission denied": "PERMISSION_DENIED",
    r"account suspended": "ACCOUNT_SUSPENDED",

    # 401 - Unauthorized
    r"not authenticated": "NOT_AUTHENTICATED",
    r"token.*expired": "TOKEN_EXPIRED",
    r"invalid.*token": "TOKEN_INVALID",
    r"token.*revoked": "TOKEN_REVOKED",

    # 409 - Conflict
    r"limit reached": "RESOURCE_LIMIT_EXCEEDED",
    r".*already exists": "DUPLICATE_RESOURCE",
    r"email.*already": "EMAIL_ALREADY_EXISTS",

    # 422 - Validation
    r"invalid input": "INVALID_INPUT",
    r"validation": "VALIDATION_ERROR",
    r"required field": "MISSING_REQUIRED_FIELD",
    r"date.*range|must be|range.*exceed": "INVALID_DATE_RANGE",
    r"moon.*not.*present|moon.*not.*available|moon data": "MISSING_MOON_DATA",
    r"sun.*not.*present|sun.*not.*available|sun data": "MISSING_SUN_DATA",
    r"hh:mm|format|invalid.*time": "INVALID_FORMAT",
    r"between.*\d+|out of range|value": "VALUE_OUT_OF_RANGE",
    r"must be|<|>|>=|<=": "INVALID_DATE_RANGE",
}

TEMPLATE = """
from app.core.error_codes import ErrorCode, get_error_message

# In the function:
error_info = get_error_message(ErrorCode.{error_code})
raise HTTPException(
    status_code=error_info["status"],
    detail=error_info["user_message"],
)
"""


def find_http_exceptions(file_path: Path) -> list[dict]:
    """Find all HTTPException raises in a file."""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
        lines = content.split("\n")

    exceptions = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if "raise HTTPException" in line:
            # Try to capture the multi-line exception
            exception_lines = [line]
            j = i + 1
            while j < len(lines) and ")" not in "".join(exception_lines):
                exception_lines.append(lines[j])
                j += 1

            exception_text = "\n".join(exception_lines)

            # Extract detail message
            detail_match = re.search(r'detail\s*=\s*["\']([^"\']+)["\']', exception_text)
            if detail_match:
                detail = detail_match.group(1)
                exceptions.append({
                    "line": i + 1,
                    "text": exception_text[:80] + "..." if len(exception_text) > 80 else exception_text,
                    "detail": detail,
                })
        i += 1

    return exceptions


def map_error_to_code(detail: str) -> Optional[str]:
    """Map an error detail message to an ErrorCode."""
    detail_lower = detail.lower().strip()

    for pattern, code in ERROR_CODE_MAP.items():
        if re.search(pattern, detail_lower):
            return code

    return None


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Migrate error messages to use ErrorCode system")
    parser.add_argument("--report", action="store_true", help="Show what needs to be updated")
    parser.add_argument("--file", help="Specific file to check")

    args = parser.parse_args()

    # Find all Python API and service files
    repo_root = Path(__file__).parent.parent
    api_dir = repo_root / "app" / "api"
    services_dir = repo_root / "app" / "services"
    core_dir = repo_root / "app" / "core"

    files_to_check = list(api_dir.glob("*.py")) + list(services_dir.glob("*.py"))

    if args.file:
        specific_file = repo_root / args.file
        if specific_file.exists():
            files_to_check = [specific_file]
        else:
            print(f"File not found: {args.file}")
            return 1

    total_exceptions = 0
    files_with_issues = 0

    for file_path in sorted(files_to_check):
        # Skip the error_codes.py file itself
        if file_path.name == "error_codes.py":
            continue

        exceptions = find_http_exceptions(file_path)

        if exceptions:
            files_with_issues += 1
            total_exceptions += len(exceptions)

            print(f"\n[FILE] {file_path.relative_to(repo_root)}")
            print(f"   Found {len(exceptions)} HTTPException(s)")

            for exc in exceptions:
                error_code = map_error_to_code(exc["detail"])
                status = "[OK]" if error_code else "[?]"

                print(f"\n   {status} Line {exc['line']}: {exc['detail'][:60]}")
                if error_code:
                    print(f"      > ErrorCode.{error_code}")
                else:
                    print(f"      > No mapping found (manual review needed)")

    print(f"\n{'='*70}")
    print(f"Summary: {total_exceptions} exception(s) in {files_with_issues} file(s) need review")
    print(f"\nNext steps:")
    print(f"1. Review the mappings above")
    print(f"2. For unmapped errors, add a new ErrorCode in app/core/error_codes.py")
    print(f"3. Update each file with the error code pattern")
    print(f"\nSee ERROR_HANDLING_GUIDE.md for details")

    return 0


if __name__ == "__main__":
    sys.exit(main())
