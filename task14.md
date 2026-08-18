Angad — Programs Page + Students Database

Date 11/08/26
1. Program Type
Update the Create/Edit Program form.
There are only two program types:
Placement
Skill
The program type should be stored as part of the Program entity and displayed clearly wherever the program is shown.
Do not keep the old product/service-style categorization.

2. Programs Banner/UI Fixes
On the Programs page:
Remove the incorrect $ dollar symbol appearing beside the ₹ pricing tag.
Prices must display only in ₹.
Reduce the height of the program banner so it takes up less vertical space.
Bring the program tabs higher so the actual program content is visible sooner.
Existing tabs:
Courses
Strategy Courses
Tracks
Roadmaps
Students
Certifications
Projects
Keep this structure, but make the UI more compact and consistent.

3. Students Tab — Replace Cards With Database
Currently, the Students tab shows every student as an individual card.
Replace this completely with a database-style table.
The goal is for this page to work as an operational student database, not a collection of profile cards.
Table
#
Student
Access
Plan
Started
Expires
Progress
Status
001
Tanvika Vasi
Paid
Basic ₹799
Aug 1
Oct 29
Day 42 / 90
Active
002
Rahul Sharma
Paid
Pro ₹999
Aug 3
Nov 30
Day 18 / 120
Active
003
Student Name
Trial
5-Day Trial
Aug 8
Aug 12
Day 4 / 5
Active

Student column
Show:
Student name
Clicking a student should open their existing Student Report.





Angad — Programs Page: Students & Program Reporting
Date: 12/08/2026
The student database/table from yesterday is already completed. Do not redo, restructure, or change the existing database table. Today's work is to build the program-level student view and reporting around it.
1. Make Students the Default Program View
Currently, when opening:
Programs → Campus Placement
the current default view is the Batches section.
Change this.
When Admin opens a particular program, the Students tab must open by default.
It should immediately show the existing student database table created yesterday.

2. Simplify the Program Header
Remove the current large banner completely.
We only need a compact program header:
Campus Placement
Below the name, show small metadata tags:
Placement
30 Days
₹799
3 Students
The student count must be connected to the backend and show the actual number of students enrolled in that program.
Do not hard-code 3.

3. Students Sub-Tabs
Inside the Students section, create two small tabs, similar to the existing Batch page:
Students
Default tab.
Contains the existing student database table from yesterday.
Reports
Contains the program-level day-wise student performance report.

4. Reports — Day-wise Performance
The Reports tab should follow the existing Batch Reports concept, but adapt it for Programs.
The Batch report currently uses:
Student
Daily Task
Daily Challenge
Calendar date / day
For Programs, remove calendar dates completely.
Students can join the same program on different dates, so calendar dates are not meaningful at the program level.
Use:
Day 1 | Day 2 | Day 3 | ... | Day 30
Example:
Student
Day 1
Day 2
Day 3
Day 4
...
Day 30
Student A
Task / Challenge
Task / Challenge
—
Task / Challenge
...
—
Student B
Task / Challenge
Task / Challenge
Task / Challenge
—
...
—

Each day should show the student's:
Daily Task result
Daily Challenge result
Attempted / Not attempted
The Program Day is what matters, not the calendar date.

5. Program Statistics
Below the compact program header, add statistics similar to the Batch page.
Total Enrolled
Total number of students ever enrolled in this program.
Current Enrolled
Students whose Program Start Date falls within the current month.
For August:
August 1 → August 31
This should be based on the student's original Program Start Date, not payment date or trial upgrade date.
Active Today
Number of students who actively participated today.
A student counts as active if they attempted:
Daily Task
Daily Challenge
Simply logging into the dashboard does not count as active.
Completed
Number of students who have completed the structured program.
Accuracy
For students who have completed the 30-day program, show their overall/final accuracy.
Don't treat an incomplete student's current accuracy as their final completion accuracy.

6. Search
Above the Students table, add a search field.
Placeholder:
Search students...
It should search by:
Student name
Email
Student ID
Search must work together with sorting and filtering.

7. Sorting
Add a Sort dropdown.
Options should include:
Latest Joined
Oldest Joined
Name A–Z
Name Z–A
Progress: Highest
Progress: Lowest
Default:
Latest Joined
The newest student must always appear at the top.
The oldest student should progressively move toward the bottom.

8. Filtering
Add a Filter dropdown.
At minimum:
Status
All
Active
Completed
Expired
Access
All
Trial
Paid
Plan
All
Trial
Basic
Pro
The filters should work together.

9. Default Table State
When the Students tab loads:
Current Month + Active/Completed students + Latest Joined First
The table should prioritize currently active students and show the most recently joined student at the top.
Example:
Active
↓
Student joined today
Student joined yesterday
Student joined Aug 8
Student joined Aug 5

Completed
↓
Older completed students
Expired historical students should not dominate the default view.

10. Important Backend Logic
Do not hard-code any of the statistics.
Everything must come from the existing student/enrollment data.
Especially:
Student count
Current enrolled count
Active today
Completed count
Accuracy
Program day
Status
The Program Start Date remains the permanent anchor for determining the student's Program Day.
For example:
Student joins Aug 31
Program Day 1 = Aug 31
If they upgrade from Trial to Paid in September, they remain an August student and their Program Day does not reset.

Definition of Done — 12/08/2026
By the end of today's work:
Opening a Program opens Students by default.
Existing student database from yesterday remains unchanged.
Large program banner is removed.
Compact program name + metadata is displayed.
Student count is dynamically fetched from backend.
Stats are added below the program header.
Students / Reports sub-tabs are added.
Reports show Day 1–Day 30, not calendar dates.
Daily Task + Daily Challenge results are represented day-wise.
Search is implemented.
Sorting dropdown is implemented.
Filtering dropdown is implemented.
Default ordering is latest joined first, with active students prioritized.
Stats and table remain connected to real backend data.
Do not modify the existing student database structure today. Build the monitoring, reporting, and program-level view on top of what was completed yesterday.






Angad — Dynamic Program Layer, Blueprints & Question Assignment
Start: 13/08/2026
Objective
We are now building the dynamic layer on top of the existing TechLearn system.
The existing systems are already built and should not be rebuilt:
Programs
Users / Students
Global Students
Question Bank
Question Categories
Track Templates
Daily Tasks
Daily Challenges
Courses / Notes
Program-level Student Database
Existing structured learning flow
The goal of this task is to connect these systems so TechLearn can automatically decide:
What should this student receive, how many questions should they receive, and when should they receive them?
The simple architecture is:
Program decides WHEN.
 Blueprint decides HOW MANY + WHAT MIX.
 Question Bank decides WHICH QUESTIONS.
 User Profile decides WHO the questions are relevant to.
 Performance Data decides WHAT THE USER NEEDS.

Phase 1 — Update Program CRUD
Priority: P0 — Start here today
The Program entity must define the structure of the learning experience.
1. Program Type
There are only two types:
Placement
Skill
The selected Program Type determines which phases and Blueprint types are available.

2. Duration
Admin enters the total program duration.
Example:
Duration: 30 Days
The phase dates must automatically be configured within this duration.
Placement Program
Show:
Phase
Start
End
Learning
1
22
Revision
23
24
Company Preparation
25
28
Mock Interview
29
29
Final Assessment
30
30

These numbers are examples.
The system must allow the Admin to change them while ensuring that:
All phases together = total program duration.
There should be no invalid gaps or overlapping days.
Skill Program
Show only:
Phase
Start
End
Learning
1
X
Final Assessment
X+1
Duration

No Revision.
No Company Preparation.
No Mock Interview for now.

Phase 1B — Program Matching Fields
Update the existing Program CRUD.
Keep
Program Name
Description
Program Type
Duration
Status
Visibility
Pricing
Student Matching Metadata
Skill Tags
Change to a dropdown / multi-select.
Target Companies
Change to multi-select chips.
Example:
TCS Infosys Accenture Cognizant
Placement Category
Use:
On-Campus
Off-Campus
Both
Remove
Remove Access Tier.
We do not need it at this stage.
Pricing already determines whether the program is free or paid.

Phase 2 — Program → Blueprints
Priority: P0 — Start after Program CRUD
Inside:
Programs → Program → Details → Blueprints
add a new Blueprints tab.
The Blueprint is not a question bank.
It does not store actual questions.
It only tells the system:
For this type of assessment/revision, how many questions should be assigned and what categories should they come from?

3. Blueprint Types
Blueprints available should be automatically determined by the Program Type.
Blueprint
Placement
Skill
Purpose
Dynamic
Day 0 Placement Readiness
✓
—
Initial readiness assessment before enrollment
Yes
Revision
✓
—
Personalized revision after structured learning
Yes
Company Preparation
✓
—
Target-company preparation
Yes
Final Assessment
✓
✓
Final assessment
Yes

Important
The structured learning days do not need Blueprints.
They already come from:
Track Template → Day → Daily Task / Daily Challenge
So we are not replacing Track Templates.

4. Day 0 Readiness Assessment
The Day 0 assessment happens after signup/onboarding but before program enrollment.
The user clicks:
Check My Readiness
Then:
Landing Page
↓
Signup / Account Creation
↓
Onboarding
↓
Target Role + Companies / Skill Goal
↓
Day 0 Readiness Assessment
↓
Results
↓
User decides whether to enroll/pay
Important distinction
If the user completes the assessment but does not enroll, they are not added to the Program → Students table.
Their information is stored as a Lead / Assessment user in the Global Students section.
If they successfully enroll:
Assessment
↓
Payment / Enrollment
↓
Program Student
↓
Day 1

5. Creating a Blueprint
When Admin opens:
Program → Blueprints → Create Blueprint
show:
Blueprint Name
Example:
Day 0 Placement Readiness
Blueprint Type
Automatically selected based on the Blueprint being created.
Question Configuration
Admin can add rows:
Question Bank Category
Question Count
Technical MCQ
10
Aptitude MCQ
10
DSA / SQL / Programming MCQ
10
Coding
1

Total:
30 MCQs + 1 Coding Question
The Admin can modify this.
For example:
Add Question Type
↓
Select Question Bank Category
↓
Enter Question Count
Example:
DSA → 5
Java → 5
SQL → 5
Aptitude → 10
Technical MCQ → 5
Coding → 1
The Blueprint stores category + quantity.
It does not store question IDs.

6. Blueprint Configuration Examples
Day 0
Category
Count
Technical MCQ
10
Aptitude MCQ
10
DSA / SQL / Programming
10
Coding
1

Revision
Category
Count
DSA
5
Java
5
SQL
5
Aptitude
5
Coding
1

The actual questions will depend on the student's performance.
Company Preparation
Category
Count
Aptitude
5
Technical MCQ
5
Coding
2
SQL
3

The actual questions will depend on:
Target company
Target role
Topics
Subtopics
Student weaknesses
Final Assessment
Example:
Category
Count
Technical MCQ
10
Aptitude
5
DSA
5
SQL
5
Coding
1

The Final Assessment must have its own Blueprint.
It must not reuse the Day 0 Blueprint.

7. Blueprint Data Model
The Blueprint should be linked to the Program.
Conceptually:
Program
│
├── Program Type
├── Duration
├── Learning Phase
├── Revision Phase
├── Company Phase
├── Final Assessment Phase
│
└── Blueprints
      │
      ├── Blueprint Type
      ├── Category
      ├── Question Count
      └── Configuration
The actual questions remain inside:
Question Bank

8. How the Question Engine Will Eventually Use the Blueprint
The Blueprint answers:
How many?
The Question Engine answers:
Which questions?
Example:
Student onboarding:
Learning Goal: Get Placed
Role: Frontend Developer
Companies:
TCS
Infosys
Accenture
Blueprint:
Technical MCQ = 10
Aptitude = 10
DSA/SQL/Programming = 10
Coding = 1
The engine then searches the existing Question Bank.
It uses:
Program
Blueprint category
User role
Target companies
Subject
Topic
Subtopic
Difficulty
Question usage
to select the actual questions.

Phase 3 — Performance Report Generator
Priority: P1 — Tomorrow
Before we build the Question Engine, we need reliable performance data.
Every completed question during structured learning should contribute to the student's performance profile.
The existing Track Template continues to control:
Day → Daily Task / Daily Challenge
The new report generator simply records and aggregates the results.

9. What We Track Every Day
For every question attempt, store:
Student
Student ID
Program ID
Program Day
Question
Question ID
Category
Subject
Topic
Subtopic
Difficulty
Pattern
Result
Attempted
Correct / Incorrect
Score
Accuracy
Time where available
This gives us:
Student
↓
Program
↓
Day
↓
Question
↓
Subject
↓
Topic
↓
Subtopic
↓
Performance

10. Daily Strength Classification
At the end of each day, aggregate performance by topic/subtopic.
Example:
Subject
Topic
Subtopic
Accuracy
Status
DSA
Arrays
Sliding Window
42%
Weak
Java
OOP
Inheritance
68%
Average
SQL
Joins
Inner Join
38%
Weak
Aptitude
Percentages
Profit & Loss
91%
Strong

Use three simple states:
Weak
Average
Strong
The exact thresholds can be defined during implementation.
The important part is:
These are calculated from actual student performance.
They are not manually entered.

11. Topic Matching Is Mandatory
Do not do:
Weak in DSA → give random DSA questions.
Instead:
DSA
↓
Arrays
↓
Sliding Window
↓
Weak
The engine should search specifically for:
DSA + Arrays + Sliding Window
before falling back to broader DSA questions.
This is what makes the revision genuinely personalized.

Phase 4 — Dynamic Question Engine
Priority: P1 — Monday
Once the Blueprint and Performance Report Generator are ready, build the Question Engine.
The Question Engine should:
Read Blueprint
↓
Read User Profile
↓
Read User Performance
↓
Read Program Day
↓
Filter Question Bank
↓
Match Role
↓
Match Company
↓
Match Subject
↓
Match Topic/Subtopic
↓
Prioritize Weak Topics
↓
Select Required Number
↓
Return Questions

12. Question Priority
For Revision, use:
Weak → Average → Strong
But topic/subtopic matching must happen within that priority.
For example:
Weak
 ├── DSA → Arrays → Sliding Window
 └── SQL → Joins → Inner Join

Average
 └── Java → OOP → Inheritance

Strong
 └── Aptitude → Percentages
The engine should prioritize the weak topics first.

13. Question Bank Remains the Source of Truth
Do not create another question database.
Existing Question Bank remains responsible for storing:
Question
Category
Subject
Topic
Subtopic
Role
Company
Pattern
Difficulty
Usage
The engine only queries the existing Question Bank.

Phase 5 — Revision Engine
Revision starts automatically when the Learning Phase ends, based on the Program configuration.
Example:
Learning: 1–22
Revision: 23–24
When the student reaches Day 23:
Structured Learning Ends
↓
Revision Engine Activates
↓
Read Performance Report
↓
Find Weak Topics
↓
Generate Revision Notes
↓
Generate Revision Questions

14. Revision Notes
When the user clicks:
Daily Notes
during the Revision phase, the system should show personalized revision material based on their weak areas.
Example:
Your Revision Focus

1. DSA — Sliding Window
2. SQL — Joins
3. Java — Inheritance
Use the existing courses/notes/content where possible.
Do not create a second curriculum.

15. Revision Tasks & Challenges
The Revision Blueprint determines the quantity.
The Question Engine determines the questions.
Example:
Revision Blueprint

DSA = 5
Java = 5
SQL = 5
Aptitude = 5
Coding = 1
Then:
Blueprint
+
Student Weak Topics
+
Role
+
Performance
↓
Question Engine
↓
Revision Questions
The existing Daily Task / Daily Challenge infrastructure should be reused rather than creating another task system.

Phase 6 — Company Preparation
After Revision, the Program enters Company Preparation.
Example:
Day 25–28
The Company Preparation Blueprint controls the daily question composition.
The engine uses:
Selected companies
Target role
Relevant subjects
Topics
Subtopics
Student performance
Example:
Company: Accenture
Role: Frontend Developer
The engine looks for relevant questions from the existing Question Bank.
If the student selected:
TCS
Infosys
Accenture
the question pool can use those selected companies.
If exact company-tagged questions are unavailable, use a logical fallback:
Company + Role
↓
Role + Subject
↓
Role + Topic
↓
General relevant Topic
The system should not fail simply because a specific company question is unavailable.

Phase 7 — Final Assessment
The Final Assessment has its own Blueprint.
It is independent from:
Day 0 Blueprint
Revision Blueprint
Company Preparation Blueprint
This allows Admin to control the final assessment separately.
Example:
Technical MCQ = 10
Aptitude = 5
DSA = 5
SQL = 5
Coding = 1
The engine pulls the actual questions from the Question Bank.

Final Architecture
                   PROGRAM
                       │
             ┌─────────┴─────────┐
             │                   │
        PROGRAM PHASES        BLUEPRINTS
             │                   │
     Determines WHEN      Determines HOW MANY
             │             + WHAT MIX
             │                   │
             └─────────┬─────────┘
                       ↓
                QUESTION ENGINE
                       ↓
                  QUESTION BANK
                       ↑
                       │
             ┌─────────┴─────────┐
             │                   │
        USER PROFILE       PERFORMANCE DATA
             │                   │
       Role / Companies     Weak / Average /
       Learning Goal        Strong Topics

Complete Student Flow
LANDING PAGE
     ↓
Check My Readiness
     ↓
SIGNUP + ONBOARDING
     ↓
Role / Companies / Goal
     ↓
DAY 0 BLUEPRINT
     ↓
QUESTION ENGINE
     ↓
QUESTION BANK
     ↓
READINESS ASSESSMENT
     ↓
RESULTS
     ↓
 ┌───────────────┐
 │               │
Enroll          Don't Enroll
 │               │
 ↓               ↓
Program Student  Lead
 │               │
Day 1            Global Students → Leads
 ↓
DAY 1–22
Structured Track Templates
 ↓
Daily Tasks + Daily Challenges
 ↓
Performance Tracking
 ↓
Weak / Average / Strong
 ↓
DAY 23–24
Revision Engine
 ↓
Personalized Notes
+
Revision Questions
 ↓
DAY 25–28
Company Preparation
 ↓
Company Blueprint
+
Question Engine
 ↓
DAY 29
Mock Interview
 ↓
DAY 30
Final Assessment Blueprint
 ↓
Final Assessment
 ↓
Final Report

Today's Work — 13/08/2026
P0 — Angad
1. Program CRUD Update
Placement / Skill type
Duration
Dynamic phase configuration
Learning phase
Revision phase for Placement
Company Preparation phase for Placement
Mock Interview phase for Placement
Final Assessment phase
Skill Program Learning + Final Assessment
Skill Tags dropdown
Target Company chips
Placement Category: On-Campus / Off-Campus / Both
Remove Access Tier
2. Program Blueprint Tab
Add Blueprints tab/button inside Program Details
Create Blueprint
Edit Blueprint
Delete Blueprint
Blueprint type based on Program Type
Category selection
Question count
Add/remove question configuration rows
Store Blueprint against Program
Do not store actual question IDs
3. Blueprint API / Data Model
Store:
Program ID
Blueprint Type
Category
Question Count
Configuration/status fields as required

Tomorrow — 14/08/2026
P1 — Performance Report Generator
Build the data/reporting layer that tracks:
Program Day
Daily Task results
Daily Challenge results
Subject
Topic
Subtopic
Questions attempted
Correct answers
Accuracy
Weak / Average / Strong classification
This must become the data source for the future Revision Engine.

Monday Onwards— Question Engine
Once the Blueprint + Performance Report are working:
Build the Dynamic Question Assignment Engine.
It must read:
Blueprint + User Profile + Performance + Program Day
and pull questions from the existing Question Bank based on:
Category
Role
Company
Subject
Topic
Subtopic
Difficulty
Usage
with:
Weak → Average → Strong
prioritization for revision.

Buffer / Testing
Test:
Placement Program
Skill Program
Different program durations
Different Blueprint configurations
Different roles
Multiple target companies
Weak / Average / Strong topics
Missing company questions
Insufficient questions in a category
Revision activation
Company preparation
Final assessment
Duplicate question prevention
