# Phase 1: Data Model

## Entities

### Admin

- id: uuid (pk)
- email: string (unique, indexed)
- allowlisted: boolean
- createdAt: timestamp
- lastActiveAt: timestamp nullable

### User

- id: uuid (pk)
- name: string
- consent: boolean (default true on creation)
- createdAt: timestamp
- createdByAdminId: uuid (fk -> Admin.id)

### Media

- id: uuid (pk)
- userId: uuid (fk -> User.id, indexed)
- type: enum('image','audio')
- storagePath: string (Supabase Storage key)
- publicUrl: string
- analysisJson: jsonb nullable
- provider: enum('openai_vision','hume') nullable
- model: string nullable
- status: enum('pending','processing','succeeded','failed') default 'pending'
- error: string nullable
- createdAt: timestamp

### Template

- id: uuid (pk)
- templateType: enum('first_impression','first_impression_divergence','my_type','my_type_divergence','romance_compatibility','friendship_compatibility') (unique)
- externalDocumentId: string (Google Doc id)
- externalDocumentUrl: string
- createdAt: timestamp

### Report

- id: uuid (pk)
- reportType: enum('first_impression','first_impression_divergence','my_type','my_type_divergence','romance_compatibility','friendship_compatibility') (indexed)
- primaryUserId: uuid (fk -> User.id, indexed)
- secondaryUserId: uuid nullable (fk -> User.id)
- templateType: same enum as Template.templateType
- templateDocumentId: string
- templateRevisionId: string
- templateRevisionLabel: string (date or revision name) nullable
- aiProviderName: string
- aiModelName: string
- content: text (full report output)
- createdAt: timestamp

## Relationships & Rules

- A `User` has many `Media` and many `Report` (as primary; may also be secondary)
- `Media.status` reflects Hume/OpenAI processing lifecycle for analysisJson
- `Report` is immutable (no updates after insert)
- Validation:
  - New user requires at least one media (image or audio)
  - Compatibility reports require both users to exist and be selectable
  - On missing analyses, proceed with available inputs and annotate missing context

## Indexing

- Users: (createdAt desc) for listing
- Reports: (primaryUserId, createdAt desc)
- Media: (userId, createdAt desc)
