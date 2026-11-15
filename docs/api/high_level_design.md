# Requirements

Currently building: Phase 0

## Phase 0 - Minimum Viable Product (MVP)
Bare minimum functionality for the app to achieve its purpose (tracking recipes). More than a proof of concept, but probably not very interesting for real users.
- Users/Basic Authentication
    - Create an Account
    - Log In
    - Basic profile - Username, Email, Name, Pronouns, Join Date
- Create, view, and persist recipes
    - Ingredients: quantity, unit, ingredient, adjective
    - Steps: simple paragraphs, sequential
    - Time estimation
    - Recipe journals: keep track of results and learnings when making a recipe

## Phase 1 - Minimum Polished Product (MPP)
Top priority enhancements from the MVP that should be added to make the app compelling for actual users.
- Enhanced authentication
    - Email verification
    - Reset password
    - Change email and password
    - Reactivate a deactivated account
    - Social features!
    - Discover other users and the recipes they've created
    - Ability to like, favorite, and comment on recipes
    - More profile features - avatar/profile picture, bio, location (city/state only), privacy settings
    - Friend and follow users!
    - Share recipes with simple links
- Quality of life
    - Ingredient grouping (i.e. wet/dry ingredients, veggies, protein, whatever)
    - Tag ingredients in steps to follow along more easily
    - Ingredient substitutions
    - Auto-calculate elevation adjustments

## Phase 2 - Experimental Enhancements
Things that would be cool to add, but either are not a top priority or present tougher implementation challenges.
- AI Agent/MCP server
- Auto-import recipes from other sources
- Automatically create shopping list from recipes (like on reminders app on iPhone)

## Tech Stack
- Backend:
    - MongoDB database
    - Nest JS API
- Frontend
    - Angular Web-first build, then auto-build mobile apps with something like Ionic
