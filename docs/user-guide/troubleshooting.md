# Troubleshooting Guide

Common issues and how to solve them.

## Login Issues

### I can't log in

**Symptoms:**
- Login button doesn't work
- "Invalid credentials" error
- Redirected back to login page
- Password reset doesn't arrive

**Solutions:**

1. **Clear browser cache and cookies**
   - Chrome: Settings → Privacy → Clear browsing data
   - Firefox: Settings → Privacy → Clear Data
   - Safari: Preferences → Privacy → Manage Website Data

2. **Try incognito/private mode**
   - This rules out browser extension conflicts
   - If it works, disable extensions one by one to find culprit

3. **Check email for verification link**
   - Look in spam/junk folder
   - Resend verification if needed
   - Add noreply@openhorizon.cc to contacts

4. **Reset password**
   - Click "Forgot Password"
   - Check email (including spam)
   - Use strong, unique password
   - Avoid special characters that might cause issues

5. **Try different browser**
   - Chrome, Firefox, Safari, Edge all supported
   - Update browser to latest version

6. **Check account status**
   - Account may be suspended (check email for notices)
   - Organization subscription may have expired

**Still not working?**
- Email: info@openhorizon.cc
- Include: email address, browser version, error message
- Screenshot any error messages

---

## Project Generation Issues

### Project won't generate

**Symptoms:**
- "Generate Project Ideas" button doesn't respond
- Stuck on loading screen
- No seeds appear after waiting
- Error message appears

**Solutions:**

1. **Wait longer**
   - AI generation can take 20-60 seconds
   - Don't refresh page while generating
   - Look for progress indicator

2. **Refresh the page**
   - If stuck for over 2 minutes
   - Try generation again

3. **Simplify your prompt**
   - Very complex prompts may timeout
   - Try shorter, clearer description
   - Example: "Youth exchange about digital skills in Sweden and Poland"

4. **Check internet connection**
   - Slow connection can cause timeouts
   - Try different network
   - Disable VPN temporarily

5. **Clear browser cache**
   - Old cached data can interfere
   - Clear cache and try again

6. **Try in 5 minutes**
   - Temporary API issues resolve quickly
   - Server may be under heavy load

**Still not working?**
- Report bug: [GitHub Issues](https://github.com/gpt153/openhorizon.cc/issues)
- Include: prompt text, browser console errors (F12 → Console tab)
- Screenshot error message

---

## Export Issues

### Export fails or downloads empty file

**Symptoms:**
- "Export" button does nothing
- Downloaded PDF/DOCX is blank
- Export hangs or times out
- Error message appears

**Solutions:**

1. **Check all required fields**
   - Click "Review" before exporting
   - Complete any missing sections
   - Ensure project has at least one phase

2. **Try different export format**
   - If PDF fails, try Word
   - If Word fails, try PDF
   - Isolates format-specific issues

3. **Check browser download settings**
   - Ensure downloads aren't blocked
   - Check downloads folder location
   - Try "Save As" instead of default location

4. **Disable browser extensions**
   - Ad blockers can interfere with downloads
   - Download managers may cause issues
   - Try incognito/private mode

5. **Try different browser**
   - Chrome, Firefox, Safari, Edge
   - Update to latest version

6. **Reduce export size**
   - Uncheck "Include appendices"
   - Use "Minimal" template instead of "Detailed"
   - Export sections separately

**Still not working?**
- Email: info@openhorizon.cc
- Include: project name, export format, browser version
- Attach screenshot of error

---

## AI Chat Issues

### AI conversation stops responding

**Symptoms:**
- AI chat doesn't respond
- "Waiting for AI" message never completes
- Conversation freezes
- Error in chat window

**Solutions:**

1. **Wait 60 seconds**
   - AI processing can be slow during peak times
   - Complex questions take longer

2. **Refresh the page**
   - Conversation history is saved
   - Reloading resets connection

3. **Simplify your question**
   - Very long or complex requests may timeout
   - Break into smaller questions
   - Be more specific

4. **Check internet connection**
   - Slow connection affects real-time chat
   - Try different network

5. **Start new conversation**
   - Click "New Chat" or "Clear Conversation"
   - Summarize context in first message
   - Ask question again

6. **Try later**
   - Peak usage times may cause slowdowns
   - Try off-peak hours

**Still not working?**
- Report bug: [GitHub Issues](https://github.com/gpt153/openhorizon.cc/issues)
- Include: last message sent, browser console errors
- Note time and duration of issue

---

## Budget Calculator Issues

### Budget shows wrong amounts

**Symptoms:**
- Budget totals seem incorrect
- Unit costs don't match Erasmus+ rules
- Distance calculation is wrong
- Categories don't add up

**Solutions:**

1. **Verify input data**
   - Check participant numbers are correct
   - Ensure countries are accurate
   - Verify project duration (days)
   - Confirm dates match timeline

2. **Check country selections**
   - Host country determines unit costs
   - Unit costs vary significantly by country
   - Ensure you selected correct country

3. **Verify distances**
   - Calculator uses capital-to-capital distance
   - If using different cities, update manually
   - Check distance band is correct

4. **Review Erasmus+ rates**
   - Unit costs updated annually
   - Ensure you're using current year rates
   - Check Programme Guide for your year

5. **Recalculate**
   - Click "Recalculate Budget"
   - Refresh page and check again
   - Clear browser cache

6. **Compare with manual calculation**
   - Use official EU distance calculator
   - Check unit cost tables manually
   - Verify your math

**If calculation is actually wrong:**
- This may be a bug
- Report: [GitHub Issues](https://github.com/gpt153/openhorizon.cc/issues)
- Include: project details, expected vs. actual amounts
- Screenshot budget breakdown

---

## Vendor Search Issues

### Vendor search returns no results

**Symptoms:**
- No vendors appear
- Search hangs
- Error message
- Very few results

**Solutions:**

1. **Broaden search criteria**
   - Expand date range (+/- 2 days)
   - Increase budget slightly
   - Remove optional filters
   - Try nearby cities/regions

2. **Check dates**
   - Ensure dates are future (not past)
   - Avoid impossible dates (Feb 30)
   - Consider local holiday/peak seasons

3. **Verify location**
   - Check spelling of city/country
   - Try larger nearby city
   - Use English names for international cities

4. **Adjust group size**
   - Very large groups have fewer options
   - Try searching for smaller rooms count
   - Contact venues directly for large groups

5. **Try manual entry**
   - Add known vendors manually
   - Request quotes directly
   - Use "Add Vendor Manually" feature

**Still no results?**
- Location may have limited options
- Consider nearby cities (within 50km)
- Use manual vendor entry for local providers

---

## Programme Builder Issues

### Can't add or edit activities

**Symptoms:**
- "Add Activity" button doesn't work
- Edits don't save
- Activities disappear
- Drag-and-drop not working

**Solutions:**

1. **Refresh the page**
   - Ensure project is saved first
   - Reload and try again

2. **Check phase status**
   - Phase must exist before adding activities
   - Create phase if needed

3. **Save frequently**
   - Click "Save" after each activity
   - Don't rely on auto-save
   - Refresh confirms changes saved

4. **Try different browser**
   - Drag-and-drop may have browser issues
   - Chrome and Firefox work best

5. **Disable browser extensions**
   - Extensions can interfere with drag-and-drop
   - Try incognito/private mode

6. **Check for overlapping times**
   - System may prevent time conflicts
   - Adjust times to avoid overlap

**Still not working?**
- Report bug: [GitHub Issues](https://github.com/gpt153/openhorizon.cc/issues)
- Include: browser version, what you're trying to do
- Screenshot the issue

---

## Getting Help

### Email Support

**Email:** info@openhorizon.cc

**When to email:**
- Account issues (login, password, billing)
- General questions about features
- Feedback and suggestions
- Partnership inquiries

**Response time:** 24-48 hours (weekdays)

**Include in your email:**
- Clear description of issue
- Steps you've already tried
- Browser and version
- Screenshots (if applicable)
- Project name (if relevant)

---

### Report Bugs

**GitHub Issues:** [github.com/gpt153/openhorizon.cc/issues](https://github.com/gpt153/openhorizon.cc/issues)

**When to report:**
- Features not working as expected
- Error messages
- Data loss or corruption
- Performance issues
- Security concerns

**How to write a good bug report:**

1. **Title:** Clear, specific (not "It's broken")
   - Good: "Budget calculator shows wrong distance for Stockholm-Barcelona"
   - Bad: "Budget not working"

2. **Steps to reproduce:**
   ```
   1. Create new project
   2. Set Stockholm as origin
   3. Set Barcelona as destination
   4. Go to Budget tab
   5. See incorrect distance (500km instead of 2100km)
   ```

3. **Expected behavior:**
   "Should show ~2100km (distance band 2000-2999)"

4. **Actual behavior:**
   "Shows 500km (wrong distance band)"

5. **Environment:**
   - Browser: Chrome 120
   - OS: macOS 14
   - Project: [Project name or ID if relevant]

6. **Screenshots:**
   Attach if helpful

---

### Emergency Support

**For urgent issues during Erasmus+ deadlines:**

- Email: info@openhorizon.cc
- Subject: "URGENT - Deadline [DATE]"
- Include deadline date in subject

**We prioritize:**
- Submissions due within 48 hours
- Critical data loss
- Account lockouts before deadlines
- Export failures before submissions

---

## FAQs

### General

**Q: Is my data safe?**
A: Yes. All data is encrypted and stored securely on EU servers. We are GDPR compliant and do not share data with third parties.

**Q: Can I work on multiple projects at once?**
A: Yes! Create and work on unlimited projects simultaneously.

**Q: Can I delete a project?**
A: Yes, but consider archiving instead (preserves history). Deleted projects cannot be recovered.

**Q: Is there a mobile app?**
A: Not yet. The web app works on mobile browsers but is optimized for desktop/tablet.

---

### Projects

**Q: Does OpenHorizon guarantee application approval?**
A: No. We help you plan and document projects, but approval depends on many factors reviewed by National Agencies.

**Q: Can I collaborate with team members?**
A: Organization-level collaboration is planned for future releases. Currently, one user per account; share exports manually.

**Q: What Erasmus+ actions are supported?**
A: Currently KA1 (Learning Mobility) and KA2 (Cooperation Partnerships). KA3 support coming soon.

**Q: Can I use OpenHorizon for non-Erasmus+ projects?**
A: Yes! While optimized for Erasmus+, you can adapt it for other projects.

---

### Budget

**Q: Are unit costs accurate?**
A: We use official Erasmus+ unit cost tables, updated annually. Always verify against current Programme Guide.

**Q: Can I override unit costs?**
A: For most categories, no (that's how Erasmus+ works). You can adjust participant numbers, duration, and inclusion costs.

**Q: What if my actual costs are different from unit costs?**
A: Unit costs are fixed. You can spend more or less; funding amount doesn't change. See [Budget Guide](features/budget.md).

---

### Export

**Q: What format should I use for submission?**
A: Check with your National Agency. Most accept PDF. Some require Word for form completion.

**Q: Can I edit exported files?**
A: Word and Excel are fully editable. PDF requires PDF editing tools. Better to edit in OpenHorizon and re-export.

**Q: How many times can I export?**
A: Unlimited! Export as many times as needed.

---

## Still Need Help?

If you've tried everything and still having issues:

1. **Check our documentation**
   - [Getting Started](getting-started.md)
   - [Feature Guides](README.md)

2. **Search GitHub Issues**
   - Someone may have reported same problem
   - Solutions may be documented

3. **Contact us**
   - Email: info@openhorizon.cc
   - GitHub: [New Issue](https://github.com/gpt153/openhorizon.cc/issues/new)

We're here to help! 🤝

---

**Remember:** Most issues resolve with:
- Refreshing the page
- Clearing browser cache
- Trying a different browser
- Waiting a few minutes
- Checking internet connection

Don't hesitate to reach out if you're stuck!
