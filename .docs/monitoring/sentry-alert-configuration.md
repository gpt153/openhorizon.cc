# Sentry Alert Configuration Guide

This guide provides step-by-step instructions for configuring Sentry alerts for the OpenHorizon platform.

## Prerequisites

- Sentry account with admin access
- Slack workspace (for Slack notifications)
- Team email addresses configured

## Alert Configuration Steps

### Step 1: Access Sentry Dashboard

1. Navigate to [https://sentry.io](https://sentry.io)
2. Select your organization
3. Select the project (e.g., `openhorizon-app` or `openhorizon-backend`)

### Step 2: Configure Slack Integration

1. Go to **Settings** → **Integrations**
2. Search for **Slack**
3. Click **Add Installation** or **Configure**
4. Authorize Sentry to access your Slack workspace
5. Select channels:
   - `#alerts-production` - Critical production alerts
   - `#dev-errors` - New error notifications
6. Test the integration by sending a test notification

### Step 3: Create Alert Rules

#### Rule 1: Critical Errors (Immediate Response)

**Purpose**: Alert on any critical error in production immediately

1. Navigate to **Alerts** → **Create Alert Rule**
2. Configure:
   - **Name**: `Critical Errors - Production`
   - **Environment**: `production`
   - **When**: `An event is seen`
   - **If**:
     - `level` equals `error` OR `fatal`
     - `environment` equals `production`
   - **Then send a notification to**:
     - ✅ Email: `team@openhorizon.cc`
     - ✅ Slack: `#alerts-production`
   - **Frequency**: `Immediately for first occurrence, then once per hour`
3. Click **Save Rule**

#### Rule 2: High-Volume Errors (Threshold Alert)

**Purpose**: Alert when error rate exceeds threshold

1. Navigate to **Alerts** → **Create Alert Rule**
2. Configure:
   - **Name**: `High Error Rate - Production`
   - **Environment**: `production`
   - **When**: `The count of errors`
   - **If**: `Is greater than 50 in 5 minutes`
   - **Filter**:
     - `environment` equals `production`
   - **Then send a notification to**:
     - ✅ Email: `team@openhorizon.cc`
     - ✅ Slack: `#alerts-production`
   - **Frequency**: `Once per hour`
3. Click **Save Rule**

#### Rule 3: New Issue Detected

**Purpose**: Notify team of new error types

1. Navigate to **Alerts** → **Create Alert Rule**
2. Configure:
   - **Name**: `New Issue - Production`
   - **Environment**: `production`
   - **When**: `A new issue is created`
   - **If**:
     - `environment` equals `production`
   - **Then send a notification to**:
     - ✅ Slack: `#dev-errors`
   - **Frequency**: `Immediately`
3. Click **Save Rule**

#### Rule 4: Performance Degradation (P95 Response Time)

**Purpose**: Alert on slow API responses

1. Navigate to **Alerts** → **Create Alert Rule**
2. Configure:
   - **Name**: `Slow API Response - Production`
   - **Environment**: `production`
   - **When**: `p95(transaction.duration)`
   - **If**: `Is greater than 5000ms (5 seconds)`
   - **Filter**:
     - `environment` equals `production`
     - `transaction.op` equals `http.server`
   - **Then send a notification to**:
     - ✅ Slack: `#alerts-production`
   - **Frequency**: `Once per 30 minutes`
3. Click **Save Rule**

### Step 4: Configure Email Settings

1. Navigate to **Settings** → **Notifications**
2. Add team email addresses:
   - `team@openhorizon.cc`
   - Individual team member emails
3. Configure notification preferences:
   - ✅ Email on critical errors
   - ✅ Email on high error rates
   - ❌ Email on every error (too noisy)

### Step 5: Test Alert Configuration

#### Test Critical Error Alert

```bash
# Frontend test
curl https://app.openhorizon.cc/api/sentry-test?type=error

# Backend test
curl https://api.openhorizon.cc/sentry-test?type=error
```

**Expected Result**:
- Error appears in Sentry dashboard within 30 seconds
- Email notification received within 1 minute
- Slack notification in `#alerts-production` within 1 minute

#### Test Custom Context Alert

```bash
# Test with custom context
curl https://app.openhorizon.cc/api/sentry-test?type=context
```

**Expected Result**:
- Error includes:
  - User ID
  - Organization ID (if applicable)
  - Request details (URL, method, headers)
  - Browser/server context

### Step 6: Configure Alert Grouping

1. Navigate to **Settings** → **Inbound Filters**
2. Enable **Smart Grouping** (recommended)
3. Configure custom fingerprinting rules (if needed):

```yaml
# Example: Group errors by endpoint and error type
fingerprint:
  - "{{ error.type }}"
  - "{{ transaction }}"
```

### Step 7: Set Up Issue Ownership

1. Navigate to **Settings** → **Ownership Rules**
2. Configure automatic assignment:

```
# API errors go to backend team
path:project-pipeline/backend/* backend-team@openhorizon.cc

# Frontend errors go to frontend team
path:app/src/* frontend-team@openhorizon.cc

# Database errors go to platform team
tags.error_type:PrismaClient* platform-team@openhorizon.cc
```

3. Save ownership rules

### Step 8: Configure Alert Muting Rules

1. Navigate to **Settings** → **Mute Rules**
2. Create mute rules for known issues:

**Example**: Mute development errors
```
Environment: development
Action: Mute alerts
Duration: Indefinite
```

**Example**: Mute browser extension errors
```
Error Message: contains "chrome-extension://"
Action: Mute alerts
Duration: Indefinite
```

## Alert Testing Checklist

- [ ] Critical error alert triggers within 1 minute
- [ ] Email notification received
- [ ] Slack notification received
- [ ] Error includes user context (user ID, email)
- [ ] Error includes organization context (org ID)
- [ ] Error includes request details (URL, method, headers)
- [ ] Error includes server/browser context
- [ ] Stack trace shows original TypeScript source (not minified)
- [ ] Errors grouped correctly by type and endpoint
- [ ] Duplicate errors don't spam notifications

## Alert Response Workflow

### When Critical Error Alert is Received

1. **Acknowledge** the alert in Slack
2. **Investigate** using Sentry dashboard:
   - Check stack trace
   - Review user context
   - Check breadcrumbs for request flow
   - Review recent deployments
3. **Assess Impact**:
   - How many users affected?
   - Is the service degraded or down?
   - Is this a new issue or regression?
4. **Take Action**:
   - **Critical**: Page on-call engineer, start incident response
   - **High**: Create GitHub issue, assign to team
   - **Medium**: Add to sprint backlog
   - **Low**: Monitor for patterns
5. **Resolve** in Sentry when fixed
6. **Document** resolution in GitHub issue/runbook

## Alert Escalation Policy

### Level 1: Warning (< 10 users affected)
- Slack notification to `#dev-errors`
- Create GitHub issue
- Resolve within 24 hours

### Level 2: Error (10-100 users affected)
- Email + Slack to `#alerts-production`
- Assign to team immediately
- Resolve within 4 hours

### Level 3: Critical (> 100 users or service down)
- Email + Slack + Page on-call
- Start incident response
- Resolve within 1 hour
- Post-mortem required

## Monitoring Alert Health

### Weekly Review

1. Review alert statistics:
   - Total alerts triggered
   - False positive rate
   - Average time to resolve
2. Tune alert thresholds if needed
3. Update mute rules for known issues
4. Review and close resolved issues

### Monthly Review

1. Analyze error trends
2. Identify repeat offenders
3. Update ownership rules
4. Review and update runbooks

## Troubleshooting

### Alerts Not Firing

1. Check alert rule is enabled
2. Verify environment filter matches
3. Test with `/sentry-test` endpoint
4. Check Sentry DSN is configured correctly
5. Verify integration credentials

### Too Many Alerts (Alert Fatigue)

1. Increase threshold for high-volume alerts
2. Add mute rules for known issues
3. Enable smart grouping
4. Filter out low-priority errors in `beforeSend`

### Slack Notifications Not Received

1. Check Slack integration is active
2. Verify channel permissions
3. Test integration with test notification
4. Re-authorize Slack integration if needed

## Additional Resources

- [Sentry Alerts Documentation](https://docs.sentry.io/product/alerts/)
- [Slack Integration Guide](https://docs.sentry.io/product/integrations/slack/)
- [Email Integration Guide](https://docs.sentry.io/product/alerts/notifications/)
- [Alert Best Practices](https://docs.sentry.io/product/alerts/best-practices/)

---

**Last Updated**: 2026-01-17
**Maintainer**: Platform Team
