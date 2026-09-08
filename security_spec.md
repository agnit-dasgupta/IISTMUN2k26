# Security Specification: IIST MUN 2026 Firebase Integration

This specification outlines the data invariants, threat model, "Dirty Dozen" attack payloads, and test assertions designed to enforce a zero-trust model on our Firebase integration.

## 1. Data Invariants

1. **Identity Binding**: A delegate registration must be irrevocably bound to the Google Authenticated Firebase user who created it (`incoming().userId == request.auth.uid`).
2. **Access Control**: Users can only `read` (get), `create`, or `update` their own registrations. Blanket listings of registrations are strictly forbidden for regular delegates.
3. **Admin Privilege**: Admins (identified by verified email matching `agnit.dg@gmail.com` or `iist.mun.club@gmail.com`) have full override access to list and inspect all registrations.
4. **Data Integrity**: Registrations must strictly conform to the expected schema (exact fields, bounded sizes, valid enumeration types).
5. **Temporal Integrity**: Creation timestamps cannot be spoofed by the client and must use the server-generated request timestamp.
6. **Inquiry Confidentiality**: Contact queries submitted via the portal can be created by visitors with bounded input sizes, but reading, listing, and deletion are restricted exclusively to administrators (`isAdmin()`).

---

## 2. The "Dirty Dozen" Attack Payloads

The following payloads attempt to violate security constraints and must be rejected with `PERMISSION_DENIED`.

### Payload 1: Unauthenticated Creation
* **Attack**: Attempting to register without being authenticated.
* **Payload**:
  ```json
  {
    "id": "IIST-123456",
    "userId": "some-uid",
    "regType": "individual",
    "name": "Attacker",
    "email": "attacker@attack.com",
    "phone": "+919999999999",
    "institution": "Dark College",
    "course": "Hacking",
    "munExperience": "None",
    "pref1Committee": "copuos",
    "pref1Country": "USA",
    "motivation": "A valid motivation of more than 20 characters."
  }
  ```

### Payload 2: Identity Spoofing (UID Cross-write)
* **Attack**: Authenticated as `user-A`, but setting `userId` to `user-B` in the payload.
* **Payload**:
  ```json
  {
    "id": "IIST-123456",
    "userId": "user-B",
    "regType": "individual",
    "name": "Attacker",
    "email": "attacker@attack.com",
    "phone": "+919999999999",
    "institution": "Dark College",
    "course": "Hacking",
    "munExperience": "None",
    "pref1Committee": "copuos",
    "pref1Country": "USA",
    "motivation": "A valid motivation of more than 20 characters."
  }
  ```

### Payload 3: Unverified Email Hijacking
* **Attack**: Authenticated, but email is unverified (email_verified == false) trying to bypass verification gates.
* **Payload**:
  ```json
  {
    "id": "IIST-123456",
    "userId": "user-A",
    "regType": "individual",
    "name": "Attacker",
    "email": "attacker@attack.com",
    "phone": "+919999999999",
    "institution": "Dark College",
    "course": "Hacking",
    "munExperience": "None",
    "pref1Committee": "copuos",
    "pref1Country": "USA",
    "motivation": "A valid motivation of more than 20 characters."
  }
  ```

### Payload 4: PII Isolation Breach (Get Other Profile)
* **Attack**: Attempting to fetch another user's registration document (e.g. `registrations/user-B`) as `user-A`.

### Payload 5: PII Isolation Breach (List All Profiles)
* **Attack**: Requesting a blanket collection query (`db.collection('registrations')`) without filtering by own `userId` to scrape all delegates' private details.

### Payload 6: Value Poisoning (Invalid Enumeration)
* **Attack**: Setting `regType` to an unapproved value like `super-delegate` to corrupt internal states.
* **Payload**:
  ```json
  {
    "id": "IIST-123456",
    "userId": "user-A",
    "regType": "super-delegate",
    "name": "Attacker",
    "email": "attacker@attack.com",
    "phone": "+919999999999",
    "institution": "Dark College",
    "course": "Hacking",
    "munExperience": "None",
    "pref1Committee": "copuos",
    "pref1Country": "USA",
    "motivation": "A valid motivation of more than 20 characters."
  }
  ```

### Payload 7: Denial of Wallet (10MB Overflow String)
* **Attack**: Injecting an oversized string in the `name` field to inflate Firestore database usage and trigger high costs.
* **Payload**:
  ```json
  {
    "id": "IIST-123456",
    "userId": "user-A",
    "regType": "individual",
    "name": "[A repeated string of 10,000,000 characters]",
    "email": "attacker@attack.com",
    "phone": "+919999999999",
    "institution": "Dark College",
    "course": "Hacking",
    "munExperience": "None",
    "pref1Committee": "copuos",
    "pref1Country": "USA",
    "motivation": "A valid motivation of more than 20 characters."
  }
  ```

### Payload 8: Immutable Field Tampering (Update UID)
* **Attack**: Modifying an existing registration to re-bind it to a different `userId`.
* **Payload (Update)**:
  ```json
  {
    "userId": "stolen-uid"
  }
  ```

### Payload 9: Invalid Motivation Statement Length
* **Attack**: Bypassing client validation to submit short motivation statement.
* **Payload**:
  ```json
  {
    "id": "IIST-123456",
    "userId": "user-A",
    "regType": "individual",
    "name": "Attacker",
    "email": "attacker@attack.com",
    "phone": "+919999999999",
    "institution": "Dark College",
    "course": "Hacking",
    "munExperience": "None",
    "pref1Committee": "copuos",
    "pref1Country": "USA",
    "motivation": "Short motivation"
  }
  ```

### Payload 10: Timestamp Poisoning
* **Attack**: Attempting to supply a spoofed future date as client timestamp.
* **Payload**:
  ```json
  {
    "timestamp": "2030-01-01T00:00:00.000Z"
  }
  ```

### Payload 11: Document ID Character Poisoning
* **Attack**: Attempting to write a document with an ID containing special scripting or invalid characters (e.g. `../../bad-path` or `<script>`).

### Payload 12: Missing Required Fields
* **Attack**: Saving a record missing crucial fields like `institution` or `phone`.
* **Payload**:
  ```json
  {
    "id": "IIST-123456",
    "userId": "user-A",
    "regType": "individual",
    "name": "Attacker"
  }
  ```

---

## 3. The Test Runner Spec (Draft)

This spec would run in a simulator using `@firebase/rules-unit-testing` or local emulation to verify our rule assertions:

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Test implementation plans...
```
