from typing import Any, Tuple


class RuleOperatorError(Exception):
    """Raised when an operator cannot be resolved or input is fundamentally malformed."""

    pass


def _coerce_numeric(val: Any) -> float:
    """Coerce value to float for numeric comparisons.
    Raises ValueError or TypeError if coercion is impossible.
    """
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        # Strip currency symbols and commas if present
        clean = val.replace("₹", "").replace(",", "").strip()
        return float(clean)
    raise TypeError(f"Cannot coerce value of type {type(val)} to numeric float")


def evaluate_operator(operator: str, user_val: Any, target_val: Any) -> Tuple[bool, str]:
    """Deterministically evaluates user_val against target_val using the specified operator.

    Returns:
        Tuple[bool, str]: (is_satisfied, auditable_reason)

    Raises:
        RuleOperatorError: If operator is unsupported or target_val structure is invalid.
    """
    op = operator.strip().upper()

    # 1. Less Than or Equal (<=)
    if op in ("<=", "LTE", "LE"):
        try:
            u_num = _coerce_numeric(user_val)
            t_num = _coerce_numeric(target_val)
            satisfied = u_num <= t_num
            reason = (
                f"{u_num} <= {t_num}"
                if satisfied
                else f"{u_num} exceeds maximum threshold of {t_num}"
            )
            return satisfied, reason
        except (ValueError, TypeError) as e:
            raise RuleOperatorError(
                f"Numeric comparison failed for operator '{operator}': {str(e)}"
            )

    # 2. Greater Than or Equal (>=)
    if op in (">=", "GTE", "GE"):
        try:
            u_num = _coerce_numeric(user_val)
            t_num = _coerce_numeric(target_val)
            satisfied = u_num >= t_num
            reason = (
                f"{u_num} >= {t_num}"
                if satisfied
                else f"{u_num} is below minimum threshold of {t_num}"
            )
            return satisfied, reason
        except (ValueError, TypeError) as e:
            raise RuleOperatorError(
                f"Numeric comparison failed for operator '{operator}': {str(e)}"
            )

    # 3. Less Than (<)
    if op in ("<", "LT"):
        try:
            u_num = _coerce_numeric(user_val)
            t_num = _coerce_numeric(target_val)
            satisfied = u_num < t_num
            reason = (
                f"{u_num} < {t_num}" if satisfied else f"{u_num} is not strictly less than {t_num}"
            )
            return satisfied, reason
        except (ValueError, TypeError) as e:
            raise RuleOperatorError(
                f"Numeric comparison failed for operator '{operator}': {str(e)}"
            )

    # 4. Greater Than (>)
    if op in (">", "GT"):
        try:
            u_num = _coerce_numeric(user_val)
            t_num = _coerce_numeric(target_val)
            satisfied = u_num > t_num
            reason = (
                f"{u_num} > {t_num}"
                if satisfied
                else f"{u_num} is not strictly greater than {t_num}"
            )
            return satisfied, reason
        except (ValueError, TypeError) as e:
            raise RuleOperatorError(
                f"Numeric comparison failed for operator '{operator}': {str(e)}"
            )

    # 5. Equality (==)
    if op in ("==", "=", "EQ", "EQUALS"):
        if isinstance(target_val, bool):
            if isinstance(user_val, str):
                u_bool = user_val.strip().lower() in ("true", "yes", "1", "t")
                satisfied = u_bool == target_val
            elif isinstance(user_val, (int, float)):
                satisfied = bool(user_val) == target_val
            else:
                satisfied = user_val == target_val
        elif isinstance(user_val, str) and isinstance(target_val, str):
            satisfied = user_val.strip().lower() == target_val.strip().lower()
        else:
            satisfied = user_val == target_val
        reason = (
            f"'{user_val}' matches '{target_val}'"
            if satisfied
            else f"'{user_val}' does not match required '{target_val}'"
        )
        return satisfied, reason

    # 6. Inequality (!=)
    if op in ("!=", "<>", "NEQ", "NOT_EQUALS"):
        if isinstance(target_val, bool):
            if isinstance(user_val, str):
                u_bool = user_val.strip().lower() in ("true", "yes", "1", "t")
                satisfied = u_bool != target_val
            elif isinstance(user_val, (int, float)):
                satisfied = bool(user_val) != target_val
            else:
                satisfied = user_val != target_val
        elif isinstance(user_val, str) and isinstance(target_val, str):
            satisfied = user_val.strip().lower() != target_val.strip().lower()
        else:
            satisfied = user_val != target_val
        reason = (
            f"'{user_val}' does not equal '{target_val}'"
            if satisfied
            else f"'{user_val}' equals excluded '{target_val}'"
        )
        return satisfied, reason

    # 7. Set Membership (IN)
    if op in ("IN", "CONTAINS_IN"):
        if not isinstance(target_val, (list, tuple, set)):
            raise RuleOperatorError(
                f"Operator 'IN' requires target_val to be a list/set, received: {type(target_val)}"
            )

        # Normalize comparisons for strings
        if isinstance(user_val, str):
            norm_target = [str(x).strip().lower() for x in target_val]
            satisfied = user_val.strip().lower() in norm_target
        else:
            satisfied = user_val in target_val

        reason = (
            f"'{user_val}' is in allowed set {target_val}"
            if satisfied
            else f"'{user_val}' is not in allowed list {target_val}"
        )
        return satisfied, reason

    # 8. Negated Set Membership (NOT_IN)
    if op in ("NOT_IN", "NOT IN"):
        if not isinstance(target_val, (list, tuple, set)):
            raise RuleOperatorError(
                f"Operator 'NOT_IN' requires target_val to be a list/set, received: {type(target_val)}"
            )

        if isinstance(user_val, str):
            norm_target = [str(x).strip().lower() for x in target_val]
            satisfied = user_val.strip().lower() not in norm_target
        else:
            satisfied = user_val not in target_val

        reason = (
            f"'{user_val}' is excluded as required"
            if satisfied
            else f"'{user_val}' is in excluded list {target_val}"
        )
        return satisfied, reason

    # 9. Numeric Range (BETWEEN / RANGE)
    if op in ("BETWEEN", "RANGE"):
        try:
            u_num = _coerce_numeric(user_val)
            if isinstance(target_val, (list, tuple)) and len(target_val) >= 2:
                min_v = _coerce_numeric(target_val[0])
                max_v = _coerce_numeric(target_val[1])
            elif isinstance(target_val, dict) and "min" in target_val and "max" in target_val:
                min_v = _coerce_numeric(target_val["min"])
                max_v = _coerce_numeric(target_val["max"])
            else:
                raise RuleOperatorError(
                    "RANGE operator requires target [min, max] list or {'min': X, 'max': Y} dict"
                )

            satisfied = min_v <= u_num <= max_v
            reason = (
                f"{min_v} <= {u_num} <= {max_v}"
                if satisfied
                else f"{u_num} is outside allowed range [{min_v}, {max_v}]"
            )
            return satisfied, reason
        except (ValueError, TypeError) as e:
            raise RuleOperatorError(f"Range comparison failed: {str(e)}")

    # 10. String Substring / Substring search (CONTAINS)
    if op in ("CONTAINS",):
        if not isinstance(user_val, (str, list, tuple)):
            raise RuleOperatorError(
                f"CONTAINS operator requires user value to be string or collection, received: {type(user_val)}"
            )
        if isinstance(user_val, str):
            satisfied = str(target_val).lower() in user_val.lower()
        else:
            satisfied = target_val in user_val
        reason = (
            f"Value contains '{target_val}'"
            if satisfied
            else f"Value does not contain '{target_val}'"
        )
        return satisfied, reason

    raise RuleOperatorError(f"Unsupported or ambiguous operator: '{operator}'")
