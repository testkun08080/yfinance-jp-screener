from pipeline.reference_freshness import SOURCE_POLICY


def test_source_policy_is_pinned_to_the_cross_repo_contract():
    # Keep this literal pin equal to the sibling simulator module's policy.
    assert SOURCE_POLICY == {
        "combined_fundamentals": {"max_age_days": 14},
        "intelligence": {"max_age_hours": 48},
        "price": {"max_age_days": 8},
    }
