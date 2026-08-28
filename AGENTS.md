# GTA GARAGE - Codex Project Instructions

You are building **GTA GARAGE**, a full-stack web application for GTA players to manage garages, cars, car photos, friends, and crew social activity.

## Project Goal

GTA GARAGE is a garage management and social media platform for GTA players.

Players can:

* Register and login.
* Confirm email after registration.
* Reset password using a special code/token sent to email.
* Create and manage garages.
* Add cars into garages.
* Upload up to 5 photos per car.
* Add friends.
* View crew/friend activity in a social media-style feed.
* Like and comment on activity posts.

## Tech Stack

Use:

* Frontend: Next.js App Router
* Language: TypeScript
* Styling: Tailwind CSS
* Backend: Next.js Route Handlers
* Database: PostgreSQL
* ORM: Prisma
* Validation: Zod
* Authentication: Supabase Auth or custom JWT auth
* File Storage: Supabase Storage or Cloudinary
* Email Service: Resend or Nodemailer
* Deployment-ready environment variables

## Main Features

### Authentication

Build an authentication system with:

* Register using email and password.
* Email confirmation after registration.
* Login using email and password.
* Logout.
* Protected routes.
* Forgot password system:

  * User enters email.
  * System sends a special reset code/token to the user's email.
  * User enters the code/token.
  * User can set a new password.
  * Reset code/token must expire.
  * Reset code/token can only be used once.

### User Profile

Each user should have:

* id
* username
* email
* avatar
* bio
* createdAt
* updatedAt

Rules:

* Username must be unique.
* User can edit their own profile.

### Garage System

Users can create and manage garages.

Each garage should have:

* id
* userId
* garageName
* location
* description
* createdAt
* updatedAt

Required CRUD:

* Create garage
* Read garage list
* Read garage detail
* Update garage
* Delete garage

### Car Management

Users can add cars into a garage.

Each car should have:

* id
* garageId
* userId
* carName
* carModel
* description
* location
* createdAt
* updatedAt

Rules:

* Every car must have a car name.
* A car belongs to one garage.
* Users can only manage their own cars.

Required CRUD:

* Add car
* View car detail
* Edit car
* Delete car

### Car Photo Upload

Users can upload up to 5 photos per car.

Rules:

* Maximum 5 photos per car.
* Allowed file types: jpg, jpeg, png, webp.
* Limit file size.
* Store images in Supabase Storage or Cloudinary.
* User can delete individual photos.
* When a car is deleted, related photos should also be deleted from database and storage.

Each photo should have:

* id
* carId
* userId
* imageUrl
* caption
* createdAt

### Friend System

Users can:

* Search other players by username.
* Send friend request.
* Accept friend request.
* Reject friend request.
* Remove friend.

Rules:

* Prevent duplicate friend requests.
* User cannot add themselves as friend.
* Friend request status: pending, accepted, rejected.

### Crew Social Feed

Create a special endpoint for social media activity so crew/friends can see player activity.

The feed should show:

* When a player uploads a car photo.
* When a player adds a new car.
* When a player creates a new garage.

Each activity should include:

* activityId
* userId
* username
* avatar
* activityType
* carName
* garageName
* imageUrl if available
* caption
* createdAt
* likeCount
* commentCount
* whether current user liked it

Feed rules:

* Show activities from the current user and accepted friends/crew.
* Sort by newest first.

### Like System

Users can like activity posts.

Rules:

* One user can only like an activity once.
* User can unlike activity.

Each like should have:

* id
* activityId
* userId
* createdAt

### Comment System

Users can comment on activity posts.

Each comment should have:

* id
* activityId
* userId
* commentText
* createdAt
* updatedAt

Rules:

* User can delete their own comment.
* User can optionally edit their own comment.

## Required API Endpoints

### Auth

* POST /api/auth/register
* POST /api/auth/login
* POST /api/auth/logout
* POST /api/auth/confirm-email
* POST /api/auth/forgot-password
* POST /api/auth/reset-password
* GET /api/auth/me

### Profile

* GET /api/profile/me
* PATCH /api/profile/me
* GET /api/users/search?username=

### Garage

* POST /api/garages
* GET /api/garages
* GET /api/garages/:id
* PATCH /api/garages/:id
* DELETE /api/garages/:id

### Cars

* POST /api/garages/:garageId/cars
* GET /api/garages/:garageId/cars
* GET /api/cars/:id
* PATCH /api/cars/:id
* DELETE /api/cars/:id

### Car Photos

* POST /api/cars/:carId/photos
* GET /api/cars/:carId/photos
* DELETE /api/photos/:id

### Friends

* POST /api/friends/request
* GET /api/friends/requests
* POST /api/friends/accept
* POST /api/friends/reject
* GET /api/friends
* DELETE /api/friends/:friendId

### Social Feed

* GET /api/feed
* POST /api/feed/:id/like
* DELETE /api/feed/:id/like
* POST /api/feed/:id/comment
* GET /api/feed/:id/comments
* PATCH /api/comments/:id
* DELETE /api/comments/:id

## Database Models

Create Prisma models for:

* User
* Garage
* Car
* CarPhoto
* FriendRequest
* Friendship
* Activity
* ActivityLike
* ActivityComment
* PasswordResetCode or PasswordResetToken
* EmailVerificationToken if not using Supabase built-in email confirmation

## Security Requirements

* Hash passwords using bcrypt if using custom auth.
* Never store plain text passwords.
* Validate all request bodies using Zod.
* Use authentication middleware for protected routes.
* Users can only edit/delete their own data.
* Validate image upload count so each car only has maximum 5 photos.
* Rate limit forgot password endpoint.
* Reset code/token must expire.
* Reset code/token can only be used once.
* Prevent SQL injection by using Prisma.
* Use environment variables for secrets.

## UI Pages

Create these pages:

* Landing page
* Register page
* Login page
* Confirm email page
* Forgot password page
* Reset password page
* Dashboard
* My Garages page
* Garage detail page
* Add garage page
* Edit garage page
* Add car page
* Car detail page
* Edit car page
* Upload car photos page
* Friends page
* Friend requests page
* Social feed page
* Profile page
* Edit profile page

## UI Style

Design the app with a **GTA-inspired garage theme**, but make it **readable, soft on the eyes, and comfortable for nighttime use**, because users will often open the app at night.

UI direction:

* Dark premium interface, but avoid pure black.
* Use soft dark colors such as charcoal, midnight blue, dark graphite, or muted navy.
* Use neon accents carefully, not too bright or overwhelming.
* Neon colors should be used only for highlights, active states, buttons, badges, and small visual details.
* Avoid high-contrast harsh colors that can make the eyes tired.
* Prioritize readability and comfort.
* Use clean readable typography with good spacing.
* Font size should be comfortable for mobile and desktop users.
* Use soft shadows, subtle borders, and rounded cards.
* Card-based garage layout.
* Responsive for mobile and desktop.
* Image gallery for car photos with smooth spacing and clear previews.
* Social feed should look like modern social media cards but still match the garage/GTA atmosphere.
* Use dark mode as the default theme.
* Add optional light mode only if needed, but prioritize a polished dark theme.
* Use accessible color contrast for text, buttons, forms, and navigation.
* Do not use overly aggressive neon backgrounds.
* Do not make the UI look too cyberpunk or too flashy.
* The final feel should be: premium garage, modern GTA-inspired, calm, readable, and comfortable for night browsing.

## Development Rules

* Generate a clean folder structure.
* Use reusable components.
* Keep code modular.
* Add loading states.
* Add error states.
* Add empty states.
* Add README setup instructions.
* Add .env.example.
* Add seed data for demo users, garages, cars, photos, activities, likes, and comments.
* Make the app production-ready.
* Do not hardcode secrets.
* Ask before making big architectural changes.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
