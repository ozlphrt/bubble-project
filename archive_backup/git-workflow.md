# GitHub Versioning & Branching Strategy

## Document Overview

**Purpose**: Define Git workflow, branching model, versioning scheme, and release management procedures.

**Audience**: Developers (solo developer + AI assistants like Cursor).

**Scope**: All Git and GitHub operations for the project lifecycle.

---

## 1. Repository Structure

### 1.1 Repository Information

**Repository Name**: `soap-bubble-simulation`

**URL**: `https://github.com/[username]/soap-bubble-simulation`

**Visibility**: Public

**Default Branch**: `main`

**GitHub Pages**: Enabled, deployed from `gh-pages` branch

---

## 2. Branching Strategy

### 2.1 Branch Hierarchy

```
main (protected)
  ├── develop (integration)
  │   ├── feature/task-1.1-bubble-class
  │   ├── feature/task-2.1-surface-tension
  │   ├── feature/task-3.1-coalescence
  │   └── ...
  ├── release/v1.0.0
  └── hotfix/critical-bug-fix
```

### 2.2 Branch Types & Purposes

#### **main** (Production Branch)
- **Purpose**: Stable, production-ready code
- **Protection**: Yes (requires PR, passing tests)
- **Deployment**: Auto-deploy to GitHub Pages
- **Naming**: `main`
- **Lifetime**: Permanent

**Rules**:
- No direct commits allowed
- Only merge from `develop` or `hotfix/*`
- Must pass all CI tests
- Requires clean commit history

#### **develop** (Integration Branch)
- **Purpose**: Integration of completed features
- **Protection**: Optional (recommended for team, optional for solo)
- **Deployment**: Optional staging environment
- **Naming**: `develop`
- **Lifetime**: Permanent

**Rules**:
- Merge from `feature/*` branches
- Should always be in working state
- Run full test suite before merging to `main`

#### **feature/** (Feature Branches)
- **Purpose**: Develop individual tasks/features
- **Protection**: No
- **Deployment**: Local only
- **Naming**: `feature/task-X.X-short-description`
  - Examples:
    - `feature/task-1.1-bubble-class`
    - `feature/task-2.1-surface-tension`
    - `feature/task-4.1-quadtree-optimization`
- **Lifetime**: Temporary (delete after merge)

**Rules**:
- Branch from `develop`
- One feature branch per task from task list
- Keep scope limited to single task
- Merge back to `develop` via PR
- Delete after successful merge

#### **release/** (Release Branches)
- **Purpose**: Prepare for production release
- **Protection**: No
- **Deployment**: Test on staging
- **Naming**: `release/vX.Y.Z`
  - Examples:
    - `release/v1.0.0`
    - `release/v1.1.0`
- **Lifetime**: Temporary (delete after merge)

**Rules**:
- Branch from `develop`
- Only bug fixes and documentation updates
- No new features
- Merge to both `main` and `develop`
- Tag after merge to `main`

#### **hotfix/** (Emergency Fix Branches)
- **Purpose**: Critical production bug fixes
- **Protection**: No
- **Deployment**: Deploy immediately after merge
- **Naming**: `hotfix/short-description`
  - Examples:
    - `hotfix/crash-on-burst`
    - `hotfix/memory-leak`
- **Lifetime**: Temporary (delete after merge)

**Rules**:
- Branch from `main`
- Fix only the critical issue
- Merge to both `main` and `develop`
- Increment patch version
- Deploy immediately

---

## 3. Workflow Procedures

### 3.1 Starting a New Feature

**Step-by-Step Process**:

```bash
# 1. Ensure develop is up to date
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/task-1.1-bubble-class

# 3. Work on the feature
# ... make changes ...

# 4. Commit regularly with good messages
git add src/modules/bubble.js
git commit -m "feat: create Bubble class with basic properties"

# 5. Continue development
git add tests/bubble.test.js
git commit -m "test: add unit tests for Bubble class"

# 6. Push to remote when ready
git push -u origin feature/task-1.1-bubble-class

# 7. Create Pull Request on GitHub
# Navigate to GitHub and create PR from feature branch to develop
```

### 3.2 Working on a Feature

**Daily Workflow**:

```bash
# Start of day: sync with develop
git checkout feature/task-1.1-bubble-class
git fetch origin
git rebase origin/develop

# Make changes
# ... code ...

# Commit
git add .
git commit -m "feat: add deformation calculation method"

# End of day: push changes
git push origin feature/task-1.1-bubble-class
```

**Handling Conflicts**:

```bash
# If rebase has conflicts
git rebase origin/develop

# Fix conflicts in files
# ... resolve conflicts ...

git add resolved-file.js
git rebase --continue

# Force push (only on feature branches!)
git push -f origin feature/task-1.1-bubble-class
```

### 3.3 Creating a Pull Request

**PR Title Format**:
```
[Task X.X] Short description of changes
```

**Examples**:
- `[Task 1.1] Create Bubble class module`
- `[Task 2.1] Implement surface tension physics`
- `[Task 4.1] Add quadtree spatial partitioning`

**PR Description Template**:

```markdown
## Task
Implements Task X.X from the detailed task list

## Description
[Brief description of what this PR does]

## Changes
- Added X
- Modified Y
- Removed Z

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Performance impact acceptable

## Screenshots
[If applicable]

## Related Issues
Closes #X (if applicable)

## Checklist
- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Ready for review
```

### 3.4 Code Review Process

**For Solo Developer**:
- Self-review the PR diff on GitHub
- Check for:
  - Code quality
  - Test coverage
  - Documentation
  - No debug code left
  - Commit history is clean

**Automated Checks** (via GitHub Actions):
- ✓ Unit tests pass
- ✓ Test coverage maintained
- ✓ No linting errors
- ✓ Build succeeds

**Merge Criteria**:
- All tests pass ✅
- Code reviewed ✅
- Conflicts resolved ✅

### 3.5 Merging a Pull Request

**On GitHub**:
1. Ensure all checks pass
2. Click "Squash and merge" (preferred for clean history)
3. Edit commit message if needed
4. Confirm merge
5. Delete feature branch

**Merge Commit Message Format**:
```
[Task X.X] Feature description (#PR_NUMBER)

Detailed description of changes
```

**Locally after merge**:
```bash
# Update develop
git checkout develop
git pull origin develop

# Delete local feature branch
git branch -d feature/task-1.1-bubble-class
```

### 3.6 Creating a Release

**When to Release**:
- Major milestone completed (e.g., Phase 1 complete)
- All tests passing
- Documentation updated
- Ready for production

**Release Process**:

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 2. Update version numbers
# Edit package.json, update version to 1.0.0
# Edit documentation with release notes

# 3. Commit version bump
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.0"

# 4. Push release branch
git push origin release/v1.0.0

# 5. Test thoroughly
# Run all tests, manual testing, browser testing

# 6. Merge to main
git checkout main
git pull origin main
git merge --no-ff release/v1.0.0
git push origin main

# 7. Create tag
git tag -a v1.0.0 -m "Release v1.0.0 - Initial Production Release"
git push origin v1.0.0

# 8. Merge back to develop
git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop

# 9. Delete release branch
git branch -d release/v1.0.0
git push origin --delete release/v1.0.0

# 10. Create GitHub Release
# Go to GitHub > Releases > Create new release
# Select tag v1.0.0
# Add release notes
# Publish release
```

### 3.7 Hotfix Process

**Emergency Fix Workflow**:

```bash
# 1. Branch from main
git checkout main
git pull origin main
git checkout -b hotfix/crash-on-burst

# 2. Fix the bug
# ... make minimal changes ...

# 3. Commit fix
git add src/modules/physics.js
git commit -m "fix: prevent crash when bursting null bubble"

# 4. Add test
git add tests/physics.test.js
git commit -m "test: add test for null bubble burst scenario"

# 5. Push
git push origin hotfix/crash-on-burst

# 6. Create PR to main
# Create PR on GitHub

# 7. After approval, merge to main
git checkout main
git merge --no-ff hotfix/crash-on-burst
git push origin main

# 8. Tag with patch version
git tag -a v1.0.1 -m "Hotfix v1.0.1 - Fix burst crash"
git push origin v1.0.1

# 9. Merge to develop
git checkout develop
git merge --no-ff hotfix/crash-on-burst
git push origin develop

# 10. Delete hotfix branch
git branch -d hotfix/crash-on-burst
git push origin --delete hotfix/crash-on-burst
```

---

## 4. Commit Message Conventions

### 4.1 Commit Message Format

**Structure**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Example**:
```
feat(physics): add surface tension calculation

Implement Young-Laplace equation for calculating
pressure difference based on bubble radius and
surface tension coefficient.

Closes #15
```

### 4.2 Commit Types

| Type | Description | Example |
|------|-------------|---------|
| **feat** | New feature | `feat: add bubble bursting effect` |
| **fix** | Bug fix | `fix: correct volume conservation in merge` |
| **docs** | Documentation only | `docs: update API documentation` |
| **style** | Formatting, no code change | `style: fix indentation in renderer` |
| **refactor** | Code restructuring | `refactor: extract collision logic to module` |
| **perf** | Performance improvement | `perf: implement quadtree for collisions` |
| **test** | Add/modify tests | `test: add unit tests for Physics module` |
| **chore** | Maintenance tasks | `chore: update dependencies` |
| **ci** | CI/CD changes | `ci: add performance test to workflow` |

### 4.3 Commit Message Guidelines

**Subject Line**:
- Use imperative mood ("add" not "added" or "adds")
- No period at the end
- Limit to 50 characters
- Capitalize first letter
- Be specific and descriptive

**Good Examples**:
- ✅ `feat: implement bubble coalescence detection`
- ✅ `fix: resolve memory leak in particle system`
- ✅ `perf: optimize contact detection algorithm`

**Bad Examples**:
- ❌ `update stuff`
- ❌ `Fixed bug`
- ❌ `feat: added some new features and fixed bugs`

**Body** (optional):
- Wrap at 72 characters
- Explain *what* and *why*, not *how*
- Reference issues/PRs if relevant

**Footer** (optional):
- Reference issues: `Closes #123`, `Fixes #456`
- Breaking changes: `BREAKING CHANGE: API changed`

---

## 5. Versioning Scheme (Semantic Versioning)

### 5.1 Version Format

**Format**: `vMAJOR.MINOR.PATCH`

**Examples**:
- `v1.0.0` - Initial production release
- `v1.1.0` - New features added
- `v1.1.1` - Bug fix
- `v2.0.0` - Breaking changes

### 5.2 Version Increment Rules

**MAJOR** (v**X**.0.0):
- Breaking API changes
- Major architectural changes
- Incompatible with previous version
- Example: Moving from 2D to 3D

**MINOR** (v1.**X**.0):
- New features added
- Backward compatible
- New physics effects implemented
- New UI features

**PATCH** (v1.0.**X**):
- Bug fixes
- Performance improvements
- Documentation updates
- No new features

### 5.3 Pre-release Versions

**Alpha** (early development):
- Format: `v1.0.0-alpha.1`
- Unstable, breaking changes expected
- Internal testing only

**Beta** (feature complete):
- Format: `v1.0.0-beta.1`
- Feature complete, testing phase
- External testing encouraged

**Release Candidate**:
- Format: `v1.0.0-rc.1`
- Final testing, no new features
- Ready for production pending tests

**Examples**:
```
v1.0.0-alpha.1  → Early development
v1.0.0-alpha.2  → More development
v1.0.0-beta.1   → Feature complete
v1.0.0-rc.1     → Release candidate
v1.0.0          → Production release
```

---

## 6. GitHub Configuration

### 6.1 Branch Protection Rules

**For `main` branch**:

```yaml
Settings > Branches > Add rule

Branch name pattern: main

Protect matching branches:
  ☑ Require pull request before merging
    ☑ Require approvals: 0 (solo developer)
    ☑ Dismiss stale pull request approvals when new commits are pushed
  ☑ Require status checks to pass before merging
    ☑ Require branches to be up to date before merging
    Status checks required:
      - unit-tests
      - visual-tests
  ☑ Require conversation resolution before merging
  ☑ Include administrators
  ☑ Restrict who can push to matching branches
```

**For `develop` branch** (optional):

```yaml
Branch name pattern: develop

Protect matching branches:
  ☑ Require pull request before merging
    ☑ Require approvals: 0
  ☑ Require status checks to pass before merging
    Status checks required:
      - unit-tests
```

### 6.2 GitHub Actions Workflows

**Test Workflow** (`.github/workflows/test.yml`):
- Trigger: Push to any branch, PR to develop/main
- Jobs: Unit tests, visual tests
- Report: Test results and coverage

**Deploy Workflow** (`.github/workflows/deploy.yml`):
- Trigger: Push to main
- Jobs: Build, deploy to GitHub Pages
- Report: Deployment status

### 6.3 Repository Settings

**General**:
- ☑ Allow squash merging (primary method)
- ☑ Allow merge commits (for releases)
- ☐ Allow rebase merging (not recommended)
- ☑ Automatically delete head branches

**Issues**:
- ☑ Enable issues
- Templates: Bug report, Feature request

**Pull Requests**:
- PR template enabled
- Auto-link references

**GitHub Pages**:
- Source: gh-pages branch
- Custom domain: (optional)
- Enforce HTTPS: Yes

---

## 7. Release Management

### 7.1 Release Checklist

**Pre-Release**:
- [ ] All planned tasks completed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Browser testing completed
- [ ] Performance benchmarks pass

**Release**:
- [ ] Create release branch
- [ ] Final testing
- [ ] Merge to main
- [ ] Create and push tag
- [ ] Merge back to develop
- [ ] Create GitHub Release
- [ ] Deploy to production

**Post-Release**:
- [ ] Verify deployment
- [ ] Monitor for issues
- [ ] Announce release
- [ ] Archive release assets

### 7.2 CHANGELOG.md Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- New features in development

### Changed
- Changes to existing features

### Fixed
- Bug fixes

## [1.0.0] - 2024-01-15

### Added
- Initial production release
- Surface tension physics implementation
- Plateau border visualization
- Bubble bursting mechanics
- Coalescence dynamics
- Interactive parameter controls
- Performance monitoring
- Comprehensive test suite

### Technical
- Modular architecture
- 80%+ test coverage
- Automated deployment
- Cross-browser compatibility

## [0.9.0] - 2024-01-10

### Added
- Beta release
- Core physics engine
- Basic UI controls

## [0.1.0] - 2024-01-01

### Added
- Alpha release
- Proof of concept
- Basic bubble rendering
```

### 7.3 GitHub Release Notes Template

```markdown
# Release v1.0.0 - [Release Name]

## 🎉 Highlights

[Key achievements and major features]

## ✨ New Features

- **Surface Tension Physics**: Realistic bubble deformation based on Young-Laplace equation
- **Plateau Borders**: Visual highlighting of 120° triple junctions
- **Bubble Bursting**: Pressure-based bursting with fragmentation
- **Coalescence**: Bubbles merge when films rupture
- **Interactive Controls**: Mouse hover + drag parameter adjustment

## 🐛 Bug Fixes

- Fixed memory leak in particle system
- Resolved collision detection edge cases
- Corrected volume conservation in merges

## ⚡ Performance

- Implemented quadtree spatial partitioning
- Achieves 60 FPS with 500 bubbles
- 30+ FPS with 1000 bubbles

## 📚 Documentation

- Complete technical specifications
- Comprehensive test procedures
- User guide and API documentation

## 🧪 Testing

- 80%+ code coverage
- Visual regression tests
- Performance benchmarks
- Cross-browser compatibility

## 📦 Downloads

[Link to demo]
[Link to source code]

## 🙏 Acknowledgments

Thanks to the research papers and foam physics literature that informed this implementation.

## 📝 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for complete details.
```

---

## 8. Git Best Practices

### 8.1 Commit Frequency

**Good Practices**:
- Commit logical units of work
- Commit when tests pass
- Commit before risky refactoring
- Commit at end of work session

**Avoid**:
- Committing broken code
- Massive commits with many changes
- Commits with "WIP" or "temp" messages (squash these)

### 8.2 Branch Hygiene

**Keep Branches Clean**:
```bash
# Update feature branch with latest develop
git checkout feature/my-feature
git fetch origin
git rebase origin/develop

# Squash commits before merging (if needed)
git rebase -i origin/develop
# Mark commits to squash in editor

# Delete merged branches
git branch -d feature/old-feature
git fetch --prune
```

**Avoid**:
- Long-lived feature branches (>1 week)
- Branches with many merge commits
- Abandoned branches

### 8.3 Conflict Resolution

**Prevention**:
- Keep feature branches short-lived
- Regularly sync with develop
- Coordinate changes to same files

**Resolution**:
```bash
# When conflicts occur
git status
# Shows conflicted files

# Edit files, resolve conflicts
# Look for <<<<<<< HEAD markers

# Mark as resolved
git add resolved-file.js

# Continue rebase/merge
git rebase --continue
# or
git merge --continue
```

### 8.4 Git Configuration

**Recommended Settings**:

```bash
# Set user info
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Default branch name
git config --global init.defaultBranch main

# Helpful aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit
git config --global alias.lg "log --graph --oneline --decorate --all"

# Pull rebase by default
git config --global pull.rebase true

# Auto-prune on fetch
git config --global fetch.prune true
```

---

## 9. Troubleshooting Common Issues

### 9.1 Accidentally Committed to Wrong Branch

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Switch to correct branch
git checkout correct-branch

# Commit there
git add .
git commit -m "feat: correct commit message"
```

### 9.2 Need to Undo Last Commit

```bash
# Undo commit, keep changes
git reset --soft HEAD~1

# Undo commit and changes (dangerous!)
git reset --hard HEAD~1
```

### 9.3 Branch Diverged

```bash
# If your branch diverged from origin
git fetch origin
git rebase origin/feature/my-feature

# If conflicts, resolve and continue
git rebase --continue

# Force push (only on feature branches!)
git push -f origin feature/my-feature
```

### 9.4 Accidentally Pushed Sensitive Data

```bash
# Remove file from history (use carefully!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/sensitive/file" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinate with team!)
git push origin --force --all

# Better: Use tools like BFG Repo-Cleaner
```

### 9.5 Merge vs Rebase

**Use Merge**:
- For release branches → main
- For hotfix branches → main/develop
- When history preservation is important

**Use Rebase**:
- For updating feature branches
- To maintain linear history
- Before creating PR (clean up commits)

**Example**:
```bash
# Rebase feature branch
git checkout feature/my-feature
git rebase develop

# Merge release to main (preserve history)
git checkout main
git merge --no-ff release/v1.0.0
```

---

## 10. Quick Reference

### 10.1 Common Commands

```bash
# Create feature branch
git checkout -b feature/task-X.X-description

# Regular commits
git add .
git commit -m "feat: description"

# Push feature branch
git push -u origin feature/task-X.X-description

# Update feature branch
git fetch origin
git rebase origin/develop

# Create release
git checkout -b release/vX.Y.Z

# Tag release
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z

# Clean up
git branch -d feature/old-branch
git fetch --prune
```

### 10.2 Branch Status Check

```bash
# View all branches
git branch -a

# View merged branches
git branch --merged

# View unmerged branches
git branch --no-merged

# View branch history
git log --graph --oneline --all
```

### 10.3 Emergency Commands

```bash
# Stash changes quickly
git stash

# Apply stash
git stash pop

# Discard all local changes
git reset --hard HEAD

# Abort merge/rebase
git merge --abort
git rebase --abort

# Restore deleted file
git checkout HEAD -- path/to/file
```

---

## 11. Workflow Diagram

```
┌─────────────┐
│   develop   │◄──────────────────┐
└─────┬───────┘                   │
      │                           │
      │ create feature            │
      ↓                           │ merge PR
┌─────────────┐                   │
│feature/task │───────────────────┘
└─────────────┘
      │
      │ work, commit, push
      │
      ↓
┌─────────────┐
│  GitHub PR  │
└─────────────┘
      │
      │ review, tests pass
      │
      ↓
┌─────────────┐
│   develop   │
└─────┬───────┘
      │
      │ create release
      ↓
┌─────────────┐
│release/vX.Y │
└─────┬───────┘
      │
      │ test, finalize
      │
      ↓
┌─────────────┐
│    main     │◄────── hotfix/critical
└─────┬───────┘              ↑
      │                      │
      │ auto-deploy          │ emergency fix
      ↓                      │
┌─────────────┐              │
│GitHub Pages │              │
└─────────────┘              │
                             │
                        ┌─────────┐
                        │Production│
                        └─────────┘
```

---

## Summary

**Key Points**:
- Use feature branches for all development
- One task per feature branch
- Squash merge to develop for clean history
- Protect main branch with PR requirements
- Follow semantic versioning
- Write meaningful commit messages
- Tag all releases
- Clean up merged branches

**Daily Workflow**:
1. Pull latest develop
2. Create feature branch
3. Work and commit regularly
4. Push and create PR
5. Merge after tests pass
6. Delete feature branch
7. Repeat

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Status**: Awaiting Approval  
**Next Document**: Additional Documentation (README, Contributing Guide, etc.)