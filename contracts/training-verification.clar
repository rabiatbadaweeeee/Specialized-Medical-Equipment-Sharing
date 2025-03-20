;; Training Verification Contract
;; Verifies users understand proper equipment operation

(define-map training-certifications
  { user: principal, equipment-type: (string-ascii 100) }
  {
    certified-by: principal,
    certification-date: uint,
    expiration-date: uint,
    valid: bool
  }
)

(define-map authorized-trainers
  { trainer: principal, equipment-type: (string-ascii 100) }
  { authorized: bool }
)

(define-data-var admin principal tx-sender)

(define-public (add-trainer (trainer principal) (equipment-type (string-ascii 100)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (ok (map-set authorized-trainers
                { trainer: trainer, equipment-type: equipment-type }
                { authorized: true }))))

(define-public (remove-trainer (trainer principal) (equipment-type (string-ascii 100)))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (ok (map-set authorized-trainers
                { trainer: trainer, equipment-type: equipment-type }
                { authorized: false }))))

(define-public (certify-user
                (user principal)
                (equipment-type (string-ascii 100))
                (validity-period uint))
  (begin
    (asserts! (default-to false (get authorized (map-get? authorized-trainers { trainer: tx-sender, equipment-type: equipment-type }))) (err u2))
    (ok (map-set training-certifications
                { user: user, equipment-type: equipment-type }
                {
                  certified-by: tx-sender,
                  certification-date: block-height,
                  expiration-date: (+ block-height validity-period),
                  valid: true
                }))))

(define-public (revoke-certification (user principal) (equipment-type (string-ascii 100)))
  (let ((certification (unwrap! (map-get? training-certifications { user: user, equipment-type: equipment-type }) (err u1))))
    (asserts! (or (is-eq tx-sender (var-get admin)) (is-eq tx-sender (get certified-by certification))) (err u2))
    (ok (map-set training-certifications
                { user: user, equipment-type: equipment-type }
                (merge certification { valid: false })))))

(define-read-only (get-certification (user principal) (equipment-type (string-ascii 100)))
  (map-get? training-certifications { user: user, equipment-type: equipment-type }))

(define-read-only (is-certified (user principal) (equipment-type (string-ascii 100)))
  (let ((certification (default-to
                        { valid: false, expiration-date: u0 }
                        (map-get? training-certifications { user: user, equipment-type: equipment-type }))))
    (and (get valid certification) (>= (get expiration-date certification) block-height))))

(define-read-only (is-trainer (trainer principal) (equipment-type (string-ascii 100)))
  (default-to false (get authorized (map-get? authorized-trainers { trainer: trainer, equipment-type: equipment-type }))))

(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (ok (var-set admin new-admin))))
