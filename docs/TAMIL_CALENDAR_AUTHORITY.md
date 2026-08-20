# Tamil Calendar Authority

## Product authority

Vinaadi reproduces the Tamil solar-month boundaries published in the **Sri
Gnanananda Panchangam** edition selected for the relevant Tamil year. The
current source pack is the 2026–27 edition:

<https://gnanananda.org/wp-content/uploads/2026/03/panchangam26_27.pdf>

The 12 published month-start dates are stored in
`app/data/tamil_calendar_authority.py`. They are source data, not hand-tuned
exceptions to the astronomy calculation.

## Calculation boundaries

- Tamil month labels and day numbers use the selected authority's month starts
  whenever that edition covers the requested date in `Asia/Kolkata`.
- Panchangam limbs (tithi, nakshatra, yoga, karana, sunrise, and kalam) remain
  on Vinaadi's Lahiri/mean-node/whole-sign calculation doctrine.
- Outside an imported edition, the application uses its documented Lahiri
  sunset calculation. That is a fallback, not a claim that it reproduces the
  selected publisher.

## Annual update procedure

Before the next Tamil year begins:

1. Obtain the new edition from the same publisher and retain its source URL.
2. Add all 12 April–March month starts as one complete source pack; never add
   a single-date override.
3. Extend `test_selected_calendar_authority_boundaries_match_the_complete_edition`
   with the edition's 12 starts.
4. Run `pytest tests/test_tamil_calendar.py -q` and verify the dashboard and
   public panchangam response for the new year's first day.

This makes the authority explicit, auditable, and independently testable.
