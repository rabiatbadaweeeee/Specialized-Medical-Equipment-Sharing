;; Sanitization Verification Contract
;; Ensures proper cleaning between users

(define-map sanitization-records
  { equipment-id: uint, timestamp: uint }
  {
    verifier: principal,
    method-used: (string-ascii 100),
    notes: (string-ascii 500),
    verified: bool
  }
)

(define-map authorized-verifiers
  { verifier: principal }
  { authorized: bool }
)

(define-data-var admin principal tx-sender)

(define-public (add-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (ok (map-set authorized-verifiers
                { verifier: verifier }
                { authorized: true }))))

(define-public (remove-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (ok (map-set authorized-verifiers
                { verifier: verifier }
                { authorized: false }))))

(define-public (verify-sanitization
                (equipment-id uint)
                (method-used (string-ascii 100))
                (notes (string-ascii 500)))
  (begin
    (asserts! (default-to false (get authorized (map-get? authorized-verifiers { verifier: tx-sender }))) (err u2))
    (ok (map-set sanitization-records
                { equipment-id: equipment-id, timestamp: block-height }
                {
                  verifier: tx-sender,
                  method-used: method-used,
                  notes: notes,
                  verified: true
                }))))

(define-read-only (get-sanitization-record (equipment-id uint) (timestamp uint))
  (map-get? sanitization-records { equipment-id: equipment-id, timestamp: timestamp }))

(define-read-only (is-verifier (verifier principal))
  (default-to false (get authorized (map-get? authorized-verifiers { verifier: verifier }))))

(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (ok (var-set admin new-admin))))
