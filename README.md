# pointbreak-data

Public data for the [PointBreak Network](https://github.com/pointbreaklab-hub/pointbreak-network).
This repository is the database. There is no other one.

## Layout

```
jobs/<job_id>.json              one posting
events/<job_id>.jsonl           append-only event ledger for that posting
companies/<company_id>.json     company profile
users/<github_login>.json       candidate profile: skills and ship logs
attestations/<github_login>.jsonl  peer vouches about that person
receipts/<receipt_id>.json      Ed25519-signed payment receipts
```

Schemas: [API_SPECS.md](https://github.com/pointbreaklab-hub/pointbreak-network/blob/main/docs/API_SPECS.md).

## Who can write here

Nobody, directly. Every write arrives through the receipt Worker, and this is a
privacy requirement rather than an access-control convenience.

A Git commit carries its author. If candidates committed their own applications,
`git log` would map every pseudonymous application reference back to a real
person, which is precisely what the pseudonyms exist to prevent. Your current
employer could read your entire job search out of this repository.

So the Worker commits on everyone's behalf, and the only identity that reaches
these files is a random `application_ref` minted in the candidate's browser.

Peer attestations are the deliberate exception. A vouch is worthless if nobody
knows who made it, so those carry the voucher's real GitHub login.

## Reading it

Everything here is readable without authentication, by anyone, forever. Clone it
and compute the scores yourself:

```bash
git clone https://github.com/pointbreaklab-hub/pointbreak-data
```

If this project is abandoned, acquired, or turns hostile, that clone is the
entire network. That is the point.

## What is not here

No candidate names against applications. No message contents in plaintext. No
metrics a company wrote about itself: every number feeding a Ghost Score is
derived from the ledger below, and a company claim counts only once the
candidate it names confirms it.
