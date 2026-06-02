export type TceCategory = 'getting-started' | 'processes' | 'client-portal' | 'help-faqs';

export interface TceArticle {
  slug: string;
  title: string;
  category: TceCategory;
  content: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export const TCE_CATEGORIES: { slug: TceCategory; label: string; color: string }[] = [
  { slug: 'getting-started', label: 'Getting Started', color: 'blue' },
  { slug: 'processes', label: 'Processes', color: 'emerald' },
  { slug: 'client-portal', label: 'Client Portal', color: 'purple' },
  { slug: 'help-faqs', label: 'Help & FAQs', color: 'amber' },
];

export const TCE_ARTICLES: TceArticle[] = [
  {
    slug: 'tce-cutover',
    title: 'TCE Cutover',
    category: 'getting-started',
    sort_order: 1,
    content: `## ACTIONS BY EOW -- 5/29

- Review COMMs package sent out May 18th
- Copy email templates into Word / OneNote -- email templates will not carry over
- Put POCs in "Next Steps" section of trips to know where you left off and create tasks from there
- End any leads that can be ended before EOD, Friday, May 29th
- Quest will be unavailable at 5:30pm Eastern on Friday, May 29th -- ensure you finish all tasks / actions before -- **be sure to completely log off and turn off your laptop!**
- GTT Scenario Capability Checks to be added to calendars for last week of May
- **Reminder -- no weekend shifts for cutover and no late shifts first week of June.**

## Day One Checklist

Follow the Day One Checklist provided to ensure a smooth start in the new system.`,
  },
  {
    slug: 'best-practices',
    title: 'Best Practices',
    category: 'getting-started',
    sort_order: 2,
    content: `## Best Practices

- Check Client360 page for any open enquiries / recently closed enquiries and action as necessary
- Only include Destination and Time Frame in quote names when passing enquiry into team
- Create tasks with POC and the action (i.e., POC 2 -- Call; POC 4 -- email; POC 7 -- call/email)
- Log calls to tasks when applicable
- Create tasks for another GTA to qualify if you are out of office -- due date for day the call is due and label task with action
- Log emails you send through Outlook to Quest
- Maintain stats tracker until reporting is finalized`,
  },
  {
    slug: 'reference-guides',
    title: 'Reference Guides',
    category: 'getting-started',
    sort_order: 3,
    content: `## Available Guides

- **Enquiry to Quote Processes** -- How to create an enquiry and qualify the enquiry (includes Trade and Partnerships guide)
- **Closing an Enquiry**
- **How to: Additional Processes**
  - How to create a task
  - How to transfer call / create 3-way call
  - How to attach phone call to a task
- **How to: Create a Case**`,
  },
  {
    slug: 'reference-videos',
    title: 'Reference Videos',
    category: 'getting-started',
    sort_order: 4,
    content: `## Training Videos

- How To: Create a New Enquiry
- How To: New Enquiry to Qualify Enquiry
- How To: Create a new Travel Agent Contact for Existing Travel Agency
- How To: Create a new Travel Agent Enquiry
- How To: Create Smithsonian Person Account (must be done first if never enquired before)
- How To: Create Smithsonian Enquiry
- How To: Create a Case`,
  },
  {
    slug: 'closing-enquiry-options',
    title: 'Closing Enquiry Options',
    category: 'processes',
    sort_order: 5,
    content: `## Drop Down Options for Non-converting Enquiry

- **Duplicate Enquiry** -- Another open enquiry exists or the enquiry is for the same destination they are currently working with a specialist on.
- **Spam** -- Use only when it is very clearly spam
- **Created in Error** -- Marketing enquiry / employment request / product enquiry
- **Client Nonresponsive** -- Client doesn't answer/respond
- **Invalid Contact Information** -- Both email / phone number are invalid -- do not use spam
- **Non-Audley Destination** -- Client wants to travel somewhere Audley does not provide services
- **No Longer Interested** -- Client is no longer looking to plan a trip for reason not listed on drop down menu
- **Booked with Competitor** -- Client booked with another company or on their own
- **Brochure Only** -- Client only wants brochure and does not want to talk about travel plans
- **Budget Too Low** -- Client mentions an extremely low budget / does not have flexibility with or is a US client and does not meet the budget requirements for these destinations`,
  },
  {
    slug: 'client-portal-cases',
    title: 'Client Portal Cases',
    category: 'client-portal',
    sort_order: 6,
    content: `## Best Practices

- Always have your UAT sandbox client portal pulled up to allow you to use it for reference when speaking to clients
- Ensure you have Auth0 bookmarked and pull up for easy access
- Have two tabs open -- one for the GTT dashboard and one for cases
- Check your case queue as regularly as you would check your leads to ensure you keep updated on the progress of each case
- If the case is related to an Enquiry, Quote, Booking, or Task, make sure to relate the case to such
- When closing a case, make sure to attach any screenshots and "chatter" the person it relates to
- If a case is taking longer than the day it was assigned, mark it as in progress and prioritize finishing that case as soon as possible. Update your standings as a "chatter" to give a heads up on where you ended.
- If a case comes via inbound and was completed on the call, still make a case and close it.`,
  },
  {
    slug: 'how-to-raise-a-case',
    title: 'How to Raise a Case',
    category: 'client-portal',
    sort_order: 7,
    content: `## Quick Reference Guide

### MyAudley Portal
- **Issues:** Login issues, general questions
- **Department:** GTT
- **Assignment:** Reassign case to appropriate GTT or the GTT Case Queue

### Companion App
- **Issues:** Login issues, final docs not showing, technical issues
- **Department:** GTT / CEX / IT
- **Assignment:** Reassign case to appropriate GTT if needed, otherwise it will be automatically submitted to appropriate queue

### Client Refund
- **Issues:** GHA related refunds, HGS balance refunds, refunds handled in teams
- **Department:** Finance
- **Assignment:** Submit for approval. You do not need to reassign case.

### Duty Office / Client Services
- **Issues:** Post trip complaints, refund requests, travel credit, SOA related, all other CEX cases
- **Department:** CEX
- **Assignment:** The case will be assigned to the Client Engagement/US & Client Service US queue. If not, it will stay in your name and CEX will not see the case.

### General
- **Issues:** CSQ requests, duplicate account cases, HGS website, activate/deactivate accounts
- **Department:** CEX
- **Assignment:** The case will be automatically assigned to the Client Engagement US queue.`,
  },
  {
    slug: 'myaudley-portal-guide',
    title: 'MyAudley Portal Guide',
    category: 'client-portal',
    sort_order: 8,
    content: `## Portal Sections

### Dashboard
- View all trips
- Client checklist
- Documents
- Profile
- Line to call to start planning trip

### My Trips
- Current/upcoming trips
- Client wish list
- MyAudley Support

### My Checklist
- Outstanding tasks
- MyAudley support

### My Documents
- All documents related to trip
- MyAudley support

### My Payments
- Scheduled payments
- Payment history
- MyAudley support

## Test Environment

The UAT site is available for reference when speaking to clients. You can create your own portal account with either your Audley email or personal email.`,
  },
  {
    slug: 'app-vs-myaudley-portal',
    title: 'App vs. MyAudley Portal',
    category: 'client-portal',
    sort_order: 9,
    content: `## MyAudley Portal Issues
- Not being able to log into the portal
- Resetting their password
- General help navigating the portal

## Companion App Issues
- Not being able to log into the app
- Not seeing any information regarding their trip
- Technical issues with the app itself

## Key Difference
**MyAudley** is the client portal accessible online (not an app). The **Companion App** is a separate mobile app solely for final documents. You can view final docs on the MyAudley portal, but MyAudley is not part of the Companion App.

## Auth0 Verification
- **Mtrip** = Companion App
- **Myportal** = MyAudley Portal

Use Auth0 to verify which platform the client is having issues with by checking their login history.`,
  },
  {
    slug: 'auth0-client-verification',
    title: 'Auth0 -- Client Account Verification',
    category: 'client-portal',
    sort_order: 10,
    content: `**Auth0 is solely to verify a client has set up a MyAudley account.** You **will not** do anything in this system other than verify information or delete the account (if necessary).

## Steps

1. **Confirm email** -- Verify with the client that they are using the same email as on file in Client360 via QuestCRM.
2. **Check verification status** -- Search the QuestCRM email in Auth0's search bar.
   - You can resend the verification email if needed. **You cannot send a password change link.**
   - Check account history to view any attempts made by client/someone else.
   - If client email is not verified, they need to set up an account.
3. **Delete and recreate** -- If they are still unable to access their account after changing their password, you can delete the account in Auth0 and have them set up their account again. They must use the same email that is in QuestCRM.
   - If they decide to use a different email, take a case to merge the two accounts. **Do not** change the email in QuestCRM.
4. **Escalate** -- If you are still stuck, escalate the client to IT Support using the appropriate case tag.`,
  },
  {
    slug: 'client-portal-support-workflow',
    title: 'Client Portal Support Workflow',
    category: 'client-portal',
    sort_order: 11,
    content: `## MyAudley Support Levels

**Country Specialists** handle client questions related to MyAudley functionality/navigation. For more technical difficulties, raise a **MyAudley** case and select **MyAudley Request** under category.

### Level 1 -- Self Help (24/7)
- In-system help -- FAQs, How To Videos, email to case
- Examples: Forgot/reset password, how to provide booking information

### Level 2 -- Contact Audley for Support
- Trading hours -- speak to someone (MyAudleySupport/CS)
- Out of hours -- email to case
- Examples: My payments failed, portal has given me an error code

### Level 3 -- Internal Finance/Tech Support
- LINKS trading hours only
- Ticket management + SLAs
- Examples: Payment failures, portal error codes

### Level 4 -- External Tech Support
- Supplier SLAs

## Escalation Flow
Clients --> MyAudley Support + GTT Country Specialist --> Finance Support / Tech Support Service Delivery --> Tech Support Dept

## Creating a Case
- Case type: **My Audley** (Standard Case)
- Select **MyAudley Request** under category
- Fill in Subject and Description fields`,
  },
  {
    slug: 'getting-help-from-other-departments',
    title: 'Getting Help from Other Departments',
    category: 'help-faqs',
    sort_order: 12,
    content: `Most portal cases can be handled by GTT. However, there will be times you need support from another department.

## Finance -- Raise a Helpdesk Ticket
If a client has a payment issue related to the portal, raise a helpdesk ticket. You are responsible for monitoring and following up with the client.

**Steps:**
1. Navigate to Helpdesk
2. Click on Finance
3. Select the category that best meets the issue and detail it in the notes
4. Monitor until resolved and update client

*Example: Client would like to make a payment online but the system won't let them*

## IT -- Raise a Helpdesk Ticket
If a client has a technical IT issue with the portal, raise a helpdesk ticket.

**Steps:**
1. Navigate to Helpdesk
2. Click 'Quest'
3. Click 'My Audley' and submit your request stating the issue
4. Monitor until resolved and update the client

*Examples: Client can't sign in despite following proper steps, system errors in the portal*

## Sales -- Create a Task
If the client raises a sales-specific issue (not portal-related), raise a ticket for the CS and close your case advising it has been passed to sales. Let the client know the CS will be following up.

*Examples: Client wants to change itinerary, questions about T&Cs, deposit splitting*

## CEX -- Reassign the Case
Reassign the case to **Client Engagement US** and the CEX team will action accordingly.

*Examples: Client waiting for a refund, any post-trip client issues*`,
  },
  {
    slug: 'weekend-myaudley-cases',
    title: 'Weekend MyAudley Cases',
    category: 'help-faqs',
    sort_order: 13,
    content: `## Weekend Working

As a team, action portal cases during the weekend (US cases only):

1. **Designate one GTA** to distribute cases evenly from the MyAudley Inbox:
   - 10am -- check and divide the cases
   - 1pm -- check and divide the cases
   - 4pm -- check and divide the cases ONLY if all priority leads have been actioned. If not, leave them.
2. Once the GTA sends you the case email, everyone is responsible for loading the case into the system and actioning accordingly.
3. Track the number of cases you took that day and share the amount with GTMs the same way you do leads.

**Important:** When actioning the MyAudley Support inbox on weekends, only action US clients. Once a case is allocated, move the email to the 'Actioned by US' inbox.

## Weekend Escalation Process

If you have exhausted all training materials and have a **business critical issue** (e.g., clients can't access the portal), follow the escalation process below. If the issue is only affecting a few clients and is not critical, wait until Monday.

### Technology Issue Escalation:
1. Escalate to **Claire Kirkup** via Teams or email
2. Escalate to **Steve Brookman** via Teams or email
3. Escalate to **Chris Bayley** via Teams or email`,
  },
  {
    slug: 'tce-faqs',
    title: 'TCE FAQs',
    category: 'help-faqs',
    sort_order: 14,
    content: `## Enquiry FAQs

**Do we need to create a new enquiry if the old enquiry has already been closed?**
Yes. Once an enquiry is closed, you must open a new enquiry.

**Will duplicate trips only show up when they enquire with the same email / destination?**
Yes. Duplicate trips will only be flagged if they enquire with the same email and destination. Best practice: check the highlights panel for any recent enquiries.

**If a client enquires with the same email but different phone number, will previous accounts pop up?**
As long as the client enquires with the same email, the old account will attach to the enquiry. Best practice: double-check the phone number and make sure it's attached to the account.

**Do I need to convert enquiry to quote before transferring to a CS?**
Yes. You will need to convert the enquiry to a quote in order to pass to a CS.

**If a client requests a video chat on the enquiry, do I have to do a video chat?**
No. You are not required to do a video chat unless you want to. It is just a request, not a requirement.

## Phone FAQs

**When transferring a call to a CS, can you just hang up and it'll transfer?**
Yes. However, if you are concerned about the call dropping, you can merge the 3 calls and then hang up.

**Is there just one phone number for Audley Travel employees?**
No, your individual phone number is still your own. However, when using SMS, there is only one SMS number for the entire office. When you are unavailable, messages go into a queue and RSMs will filter through.

**Is the phone number click-to-dial?**
Yes, as long as you are logged into Vonage/Omni-Channel and are in ready outbound/available status.

**When it says our SMS chat has ended, does this show on the client's side?**
No. Our end will show the chat has ended, but it will not show on the client's side.

**When the GTA is in away status, will they still receive texts?**
No. The GTA needs to be available to receive texts.

## Additional Process FAQs

**Can GTT take payments from the highlights panel?**
No. GTT will not make payments. Call the line as normal and have a CS take the payment.

**Is the chatter tool still available?**
No. Chatter is no longer used in TCE. Best practice: use the notes in the task and tag relevant people.

**Do you need to check the ABC box anymore?**
No, the GTT box will be automatically clicked. Best practice: make sure you don't put it in your name if qualifying for a colleague.

**Is the MyAudley Portal and the Companion App the same thing?**
No. MyAudley is the online portal. The Companion App is solely for final docs. They are separate products.`,
  },
  {
    slug: 'portal-faq',
    title: 'Portal FAQ',
    category: 'help-faqs',
    sort_order: 15,
    content: `Reference for common portal questions. This FAQ will be updated as we encounter unique portal issues.

## Common Issues

**Why am I receiving an error on the traveler page when I try to save passenger information?**
Check for required fields and ensure all information is correctly formatted before saving.

**Client is unable to see their trips in the portal, but they are not the party lead.**
If a client makes a MyAudley account but the Party Lead has not yet, that client will not be able to see their trip. The Party Lead needs to:
1. Create their own MyAudley account
2. Navigate to their trip in the portal
3. Click "Invite Passengers" to give the client access

The client should then be able to see the shared trip in their portal.`,
  },
];
