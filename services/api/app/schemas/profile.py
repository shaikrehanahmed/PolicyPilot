from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class NormalizedProfile(BaseModel):
    """Normalized citizen demographic profile.
    Values are normalized deterministically (e.g. income to annual INR float,
    state codes to uppercase ISO/state codes, occupation to standard tokens).
    """

    state: Optional[str] = Field(
        default=None, description="2-letter Indian state/UT code (e.g., TS, DL, MH)"
    )
    age: Optional[int] = Field(default=None, ge=0, le=125, description="Citizen age in years")
    annual_income_inr: Optional[float] = Field(
        default=None, ge=0, description="Annual household income in INR"
    )
    income_band: Optional[str] = Field(default=None, description="Demographic income band")
    occupation: Optional[str] = Field(
        default=None, description="Normalized occupation category (e.g. farmer, student, artisan)"
    )
    category: Optional[str] = Field(
        default=None, description="Social category (e.g., GEN, OBC, SC, ST, EWS)"
    )
    gender: Optional[str] = Field(default=None, description="Gender (e.g., female, male, other)")
    landholding_acres: Optional[float] = Field(
        default=None, ge=0, description="Agricultural land ownership in acres"
    )
    disability_percent: Optional[float] = Field(
        default=None, ge=0, le=100, description="Disability percentage if applicable"
    )
    education_level: Optional[str] = Field(
        default=None, description="Current or completed education level"
    )
    is_minority: Optional[bool] = Field(
        default=None, description="Whether citizen belongs to notified minority community"
    )
    goal: Optional[str] = Field(default=None, description="Primary citizen need or assistance goal")

    # --- PM-KISAN Statutory Exclusion Fields (Clause 2(b) & Clause 3) ---
    is_institutional_landholder: Optional[bool] = Field(
        default=None, description="Whether landholder is an institutional entity (Clause 3(a))"
    )
    is_government_employee: Optional[bool] = Field(
        default=None,
        description="Whether citizen or household member is a regular serving/retired government employee",
    )
    is_mts_or_class_iv: Optional[bool] = Field(
        default=None,
        description="Whether the government employee or pensioner is Multi-Tasking Staff / Class IV / Group D (exempt from exclusion under Clause 2(b)(iii)&(iv))",
    )
    has_constitutional_post_holder: Optional[bool] = Field(
        default=None,
        description="Whether any family member is a former or present holder of constitutional posts (Clause 2(b)(i))",
    )
    has_specified_elected_representative: Optional[bool] = Field(
        default=None,
        description="Whether any family member is a former/present MP, MLA, MLC, Mayor, or District Panchayat Chairperson (Clause 2(b)(ii))",
    )
    has_pensioner_above_10k_non_mts: Optional[bool] = Field(
        default=None,
        description="Whether any family member receives monthly pension of ₹10,000+ excluding Class IV/MTS (Clause 2(b)(iv))",
    )
    is_income_tax_payee: Optional[bool] = Field(
        default=None,
        description="Whether citizen or any family member paid income tax in last assessment year (Clause 2(b)(v))",
    )
    has_practicing_professional: Optional[bool] = Field(
        default=None,
        description="Whether any family member is a registered practicing Doctor, Engineer, Lawyer, CA, or Architect (Clause 2(b)(vi))",
    )
    is_nri_or_foreign_resident: Optional[bool] = Field(
        default=None,
        description="Whether applicant or family is a Non-Resident Indian or foreign resident",
    )

    # --- PMAY-G Live Questionnaire Fields (Q1 through Q15) ---
    is_priority_deprived: Optional[bool] = Field(
        default=None,
        description="Q1: Houseless, destitute, manual scavenger, primitive tribal group, or bonded labourer",
    )
    residence_area: Optional[str] = Field(
        default=None, description="Q2: Residential area type, e.g. 'rural' or 'urban'"
    )
    owns_pucca_house: Optional[bool] = Field(
        default=None, description="Q3: Whether household already owns a permanent pucca house"
    )
    lives_in_kutcha_house: Optional[bool] = Field(
        default=None,
        description="Q4: Whether household resides in a kutcha house or is houseless",
    )
    has_more_than_two_pucca_rooms: Optional[bool] = Field(
        default=None,
        description="Q5: Whether house has more than 2 pucca rooms with permanent roof",
    )
    has_motorized_vehicle: Optional[bool] = Field(
        default=None,
        description="Q6: Whether household owns motorized three/four wheeler or fishing boat",
    )
    has_mechanized_agri_equipment: Optional[bool] = Field(
        default=None,
        description="Q7: Whether household owns mechanized three/four wheeler agriculture equipment",
    )
    has_kcc_above_50k: Optional[bool] = Field(
        default=None,
        description="Q8: Whether household possesses Kisan Credit Card with limit >= 50,000",
    )
    # Q9 is is_government_employee
    has_registered_non_agri_enterprise: Optional[bool] = Field(
        default=None,
        description="Q10: Whether household has any non-agriculture enterprise registered with government",
    )
    earns_above_15k_monthly: Optional[bool] = Field(
        default=None,
        description="Q11: Whether any member of household earns more than ₹15,000 per month",
    )
    # Q12 is is_income_tax_payee
    pays_professional_tax: Optional[bool] = Field(
        default=None,
        description="Q13: Whether any member of household pays professional tax",
    )
    irrigated_land_acres: Optional[float] = Field(
        default=None,
        ge=0,
        description="Q14: Irrigated agricultural land owned by household in acres (exclusion threshold >= 2.5)",
    )
    unirrigated_land_acres: Optional[float] = Field(
        default=None,
        ge=0,
        description="Q15: Unirrigated agricultural land owned by household in acres (exclusion threshold >= 5.0)",
    )

    custom_attributes: Dict[str, Any] = Field(
        default_factory=dict, description="Additional domain-specific demographic attributes"
    )

    def get_value(self, key: str) -> Any:
        """Helper to fetch an attribute by key, with statutory compound rule resolution,
        standard attributes, and custom_attributes fallback. Returns None if absent.
        """
        # Compound Rule Resolution: PM-KISAN Clause 2(b)(iii) Government Employee with MTS Exception
        if key == "is_government_employee_non_mts":
            if self.is_government_employee is None:
                return None
            if not self.is_government_employee:
                return False
            # Employee is True: Check Class IV / MTS exception
            if self.is_mts_or_class_iv is True:
                # Explicitly exempt under Clause 2(b)(iii)
                return False
            if self.is_mts_or_class_iv is False:
                # Non-exempt regular government employee -> excluded
                return True
            # Unknown whether MTS or not
            return None

        # Compound Rule Resolution: PMAY-G Q11 Income Resolution
        if key == "earns_above_15k_monthly":
            if self.earns_above_15k_monthly is not None:
                return self.earns_above_15k_monthly
            if self.annual_income_inr is not None:
                return self.annual_income_inr > 180000.0  # ₹15,000 * 12
            return None

        # Compound Rule Resolution: PMAY-G Q4 Kutcha house vs Pucca house
        if key == "lives_in_kutcha_house":
            if self.lives_in_kutcha_house is not None:
                return self.lives_in_kutcha_house
            if self.owns_pucca_house is True:
                return False
            return None

        # Compound Rule Resolution: PMAY-G Q14/Q15 Land breakdown from total landholding
        if key == "irrigated_land_acres":
            if self.irrigated_land_acres is not None:
                return self.irrigated_land_acres
            return None

        if key == "unirrigated_land_acres":
            if self.unirrigated_land_acres is not None:
                return self.unirrigated_land_acres
            return None

        if hasattr(self, key):
            val = getattr(self, key)
            if val is not None:
                return val
        return self.custom_attributes.get(key)
