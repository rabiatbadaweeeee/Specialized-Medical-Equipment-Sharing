;; Equipment Registration Contract
;; Records details of available medical devices

(define-data-var last-equipment-id uint u0)

(define-map equipment-registry
  { equipment-id: uint }
  {
    owner: principal,
    name: (string-ascii 100),
    description: (string-ascii 500),
    available: bool,
    location: (string-ascii 100),
    last-maintenance: uint
  }
)

(define-public (register-equipment
                (name (string-ascii 100))
                (description (string-ascii 500))
                (location (string-ascii 100))
                (last-maintenance uint))
  (let ((new-id (+ (var-get last-equipment-id) u1)))
    (var-set last-equipment-id new-id)
    (ok (map-set equipment-registry
                { equipment-id: new-id }
                {
                  owner: tx-sender,
                  name: name,
                  description: description,
                  available: true,
                  location: location,
                  last-maintenance: last-maintenance
                }))))

(define-public (update-availability (equipment-id uint) (available bool))
  (let ((equipment (unwrap! (map-get? equipment-registry { equipment-id: equipment-id }) (err u1))))
    (asserts! (is-eq tx-sender (get owner equipment)) (err u2))
    (ok (map-set equipment-registry
                { equipment-id: equipment-id }
                (merge equipment { available: available })))))

(define-public (update-maintenance (equipment-id uint) (maintenance-date uint))
  (let ((equipment (unwrap! (map-get? equipment-registry { equipment-id: equipment-id }) (err u1))))
    (asserts! (is-eq tx-sender (get owner equipment)) (err u2))
    (ok (map-set equipment-registry
                { equipment-id: equipment-id }
                (merge equipment { last-maintenance: maintenance-date })))))

(define-read-only (get-equipment (equipment-id uint))
  (map-get? equipment-registry { equipment-id: equipment-id }))

(define-read-only (get-last-equipment-id)
  (var-get last-equipment-id))
