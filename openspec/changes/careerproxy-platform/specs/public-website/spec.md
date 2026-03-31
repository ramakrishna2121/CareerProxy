## ADDED Requirements

### Requirement: Landing page
The system SHALL render a public landing page at `/` with a hero section, service value proposition, how-it-works steps, testimonials section, and call-to-action buttons that link to the signup flow.

#### Scenario: Visitor views landing page
- **WHEN** an unauthenticated user navigates to `/`
- **THEN** the page renders with hero headline, subheadline, CTA button linking to `/signup`, how-it-works steps, and a testimonials section

#### Scenario: CTA button navigates to signup
- **WHEN** a visitor clicks any primary CTA button on the landing page
- **THEN** the browser navigates to `/signup`

### Requirement: How it works page
The system SHALL render a `/how-it-works` page explaining the four-step process: enroll, share resume, team applies, candidate interviews.

#### Scenario: Visitor views how it works
- **WHEN** a visitor navigates to `/how-it-works`
- **THEN** the page displays a step-by-step explainer with at least four steps and a CTA to sign up

### Requirement: Pricing page
The system SHALL render a `/pricing` page displaying three plan cards (Starter $99/mo, Pro $199/mo, Premium $299/mo) with a feature comparison table and a Stripe checkout link per plan.

#### Scenario: Visitor views pricing
- **WHEN** a visitor navigates to `/pricing`
- **THEN** three plan cards are displayed, each showing the plan name, monthly price, included features, and a "Get Started" button

#### Scenario: Pricing CTA initiates checkout
- **WHEN** a visitor clicks "Get Started" on a plan card
- **THEN** the visitor is directed to the signup flow with the selected plan pre-selected

### Requirement: Public navigation
The system SHALL display a persistent navigation bar on all public pages with links to Home, How It Works, Pricing, and a Login/Sign Up button.

#### Scenario: Navigation renders on all public pages
- **WHEN** a visitor loads any public page (`/`, `/how-it-works`, `/pricing`)
- **THEN** the navigation bar is visible with all required links

#### Scenario: Login link navigates correctly
- **WHEN** a visitor clicks the Login button in the navigation
- **THEN** the browser navigates to `/login`

### Requirement: Responsive public pages
All public pages SHALL be fully usable on mobile (320px+) and desktop (1280px+) viewports.

#### Scenario: Mobile layout
- **WHEN** a visitor views a public page on a 375px wide viewport
- **THEN** the layout stacks vertically, text is readable, and CTA buttons are tappable without horizontal scrolling
