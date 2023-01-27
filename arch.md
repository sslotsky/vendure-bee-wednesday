# What is this?

A headless e-comm solution for selling custom prints of photos and digital art. 

This software depends on external solutions for image management, file storage, and email. The former is done with [ImageKit][image-kit]. File storage is configurable with any S3 compatible provider, and email is configurable via SMTP. Changing an environment variable is all that's needed to change out configurable components. 

* [Fly.io][fly] houses the storefront, API, and database
* [Vendure][vendure] provides an extensible, headless e-comm API
* [ImageKit][image-kit] is used for image management, API, and CDN
* [Cloudflare R2][r2] for file storage
* [Sendgrid SMTP Relay][sendgrid-mail] for email

The storefront uses the e-comm API, and both the storefront and the API leverage ImageKit. Customers use the storefront to add cart items consisting of:

* FileID specifying the ImageKit image file
* Transformation params with crop & resize info
* A VariantID which indicates the size and material of the print

When the customer completes the purchase, the API downloads the high-res, transformed images from ImageKit; places the images in a zip file; uploads the zip file to cloud storage; and emails to the merchant a signed URL to the zip file. The merchant takes the file down to the print shop to create the prints, and ships them to the customer.


## Merchant adds products

```mermaid
sequenceDiagram
  actor Merchant
  participant Admin
  participant ImageKit
  Merchant->>ImageKit: Upload photos
  Merchant->>Admin: Add materials and sizes
```

## Customer adds items

```mermaid
sequenceDiagram
  actor User
  participant Storefront
  participant API
  participant ImageKit
  User->>Storefront: Visit shop
  activate Storefront
  Storefront->>API: query CustomPrint
  API-->>Storefront: All custom print options
  Storefront->>API: query ActiveOrder
  API-->>Storefront: Active order details
  Storefront->>ImageKit: Get images
  ImageKit-->>Storefront: Abbie's pictures
  Storefront-->>User: Custom prints page
  deactivate Storefront
  User->>Storefront: Choose photo, material, size
  User->>Storefront: Zoom, drag, rotate crop window
  User->>Storefront: Click 'Add to cart'
  Storefront->>API: mutation AddItemToCart
```

## Customer completes order

```mermaid
sequenceDiagram
  actor User
  participant Storefront
  participant API
  participant ImageKit
  participant R2 Storage
  participant Sendgrid SMTP
  User->>Storefront: Click 'Checkout'
  Storefront->>API: mutation AddPaymentToOrder
  activate API
  API->>ImageKit: Download images
  API->>R2 Storage: Upload zip file
  API->>R2 Storage: Get signed URL
  R2 Storage-->>API: Signed URL
  API->>Sendgrid SMTP: Email file link
  deactivate API
```

[fly]: https://fly.io/
[image-kit]: https://imagekit.io/
[r2]: https://developers.cloudflare.com/r2/
[sendgrid-mail]: https://docs.sendgrid.com/glossary/smtp-relay
[vendure]: https://www.vendure.io/
