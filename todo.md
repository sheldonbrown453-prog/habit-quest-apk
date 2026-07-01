# HabitQuest - RPG Habit Tracker TODO

## Backend / Database
- [x] DB schema: userProfiles table (xp, level, tier, streak)
- [x] DB schema: habits table (name, icon, color, category, frequency, xpReward, notes)
- [x] DB schema: habitLogs table (habitId, userId, date, status)
- [x] DB schema: achievements table (definition) + userAchievements table
- [x] DB schema: dailyQuests table + userDailyQuests table
- [x] Run migration and apply SQL
- [x] tRPC router: auth (me, profile upsert)
- [x] tRPC router: habits (list, create, update, delete, complete, skip, miss)
- [x] tRPC router: profile (getProfile, XP/level logic)
- [x] tRPC router: quests (getDailyQuests, completeQuest)
- [x] tRPC router: achievements (list, check/unlock)
- [x] tRPC router: stats (completion rate, streaks, XP over time, per-habit breakdown)
- [x] tRPC router: history (habitLog calendar data)
- [x] XP scaling logic (xpForLevel function)
- [x] Warrior tier system (Novice → Warrior → Champion → Legend → ...)
- [x] Achievement auto-check on habit complete / level up

## Frontend - App Shell
- [x] Dark mode theme setup in index.css (RPG color palette)
- [x] Google Fonts (Cinzel for headings, Inter for body)
- [x] Mobile-first bottom navigation bar (5 tabs)
- [x] App.tsx routing for all pages
- [x] Auth guard / login page

## Frontend - Dashboard Page
- [x] Warrior avatar with tier badge
- [x] Level display + XP progress bar with animation
- [x] Current streak display
- [x] Today's habits list with complete/skip actions
- [x] Daily quests widget (3 quests)
- [x] Motivational quote
- [x] Level-up animation overlay

## Frontend - Habits Page
- [x] Habit list with category filter
- [x] Habit card with complete/skip/edit/delete actions
- [x] Create habit dialog (name, icon, color, category, frequency, xpReward)
- [x] Edit habit dialog
- [x] Delete confirmation

## Frontend - History Page
- [x] Heatmap calendar per habit
- [x] Monthly / yearly view toggle
- [x] Color-coded squares (green=done, red=missed, yellow=skipped, gray=none)
- [x] Tap square to see date + XP earned

## Frontend - Statistics Page
- [x] XP earned over time (line chart)
- [x] Habit completion rate (bar chart)
- [x] Longest streak display
- [x] Per-habit performance breakdown table
- [x] Total habits completed / missed / skipped

## Frontend - Achievements Page
- [x] Trophy showcase grid
- [x] Locked vs unlocked badge states
- [x] Achievement unlock animation/toast

## Frontend - Quests Page (or widget)
- [x] 3 daily quests display
- [x] Quest progress indicators
- [x] Complete quest button + bonus XP animation

## Polish & Animations
- [x] Smooth page transitions
- [x] XP gain floating number animation
- [x] Level-up celebration overlay
- [x] Achievement unlock toast with badge
- [x] Habit completion pulse/checkmark animation
- [x] Responsive mobile layout verified
- [x] Vitest tests for backend routers
- [x] Final checkpoint
