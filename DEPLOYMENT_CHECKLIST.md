# STRInvestCalc Deployment Checklist

## Local Setup
- [ ] Node.js 18+ installed
- [ ] npm install succeeds
- [ ] npm start works locally
- [ ] http://localhost:3000 loads
- [ ] npm run build succeeds

## GitHub
- [ ] Repository created at github.com
- [ ] Files uploaded to GitHub
- [ ] Code in main branch

## Vercel
- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Project imported from GitHub
- [ ] Framework: React
- [ ] Build Command: npm run build
- [ ] Output Directory: build
- [ ] Initial deployment successful

## CI/CD Setup
- [ ] VERCEL_TOKEN created (https://vercel.com/account/tokens)
- [ ] VERCEL_ORG_ID copied from Vercel
- [ ] VERCEL_PROJECT_ID copied from Vercel
- [ ] GitHub Secrets configured:
  - [ ] VERCEL_TOKEN
  - [ ] VERCEL_ORG_ID
  - [ ] VERCEL_PROJECT_ID

## Testing
- [ ] Live URL accessible
- [ ] Test commit pushed to main
- [ ] GitHub Actions ran successfully
- [ ] Vercel auto-deployed
- [ ] Live site updated

## Success!
- [ ] All items checked
- [ ] App is live on Vercel
- [ ] Auto-deployments working
