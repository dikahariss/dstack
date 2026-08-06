# BPMN notation — vocabulary, naming, and the patterns that recur

## The vocabulary you actually need

Most real processes are built from about a dozen elements. Reach past this list
only when the extra element carries a fact nothing else can.

| What you mean | Element | Notes |
|---|---|---|
| A person does something | `userTask` | It waits for a human. Most tasks in an approval process are these. |
| A system does something | `serviceTask` | Automatic. No human waits on it. |
| A decision with exclusive outcomes | `exclusiveGateway` | Exactly one branch is taken. The overwhelmingly common case. |
| Several things happen at once | `parallelGateway` | Splits *and* joins. Always pair the split with a join. |
| Wait for something outside | `intermediateCatchEvent` + `messageEventDefinition` | A payment, a webhook, another system's answer. |
| Wait for time to pass | `intermediateCatchEvent` + `timerEventDefinition` | A deadline, a cooling-off period. |
| Something can interrupt a task | `boundaryEvent` attached to the task | Timeout, cancellation, error. |
| The process begins | `startEvent` | Exactly one blank start event per process. |
| The process ends, this way | `endEvent` | **One per distinct outcome.** Not one shared "End". |
| Who is accountable | `lane` inside a `laneSet` | A role, never a person, never a system. |
| The whole service | `participant` + `collaboration` | The pool. Its name is the service. |

Avoid `inclusiveGateway` and `complexGateway`: `bpmnlint` warns on both, engines
disagree about them, and readers reliably misread them. If you think you need
one, the process usually has two decisions wearing one shape.

## Naming rules

| Element | Rule | Good | Bad |
|---|---|---|---|
| pool | the service, as a noun phrase | `Certificate issuance` | `Directorate of Ports` |
| lane | the role that acts | `Evaluator` | `Budi`, `The system`, `Backend` |
| task | verb + object, from the actor's view | `Verify supporting documents` | `Verification`, `Process`, `Step 3` |
| gateway | a question, ending in `?` | `Documents complete?` | `Gateway_1`, `Check` |
| sequence flow out of a gateway | the answer | `complete`, `missing a document` | *(empty)*, `1`, `yes/no` where the question is not yes/no |
| end event | the outcome reached | `Certificate issued`, `Application rejected` | `End`, `Finish` |
| id | `<process>_<type>_<subject>_<nnn>` | `issuance_ut_evaluator_review_001` | `Activity_0x9f2a1` |

Stable, readable ids matter more than they look: they are what a diff shows,
what an engine's incident points at, and what a second author has to match.
`ut` user task, `st` service task, `gw` gateway, `se`/`ee` start/end event,
`ie` intermediate event — pick a scheme and hold it across the whole catalog.

## One complete model

Semantic only — no DI, because `scripts/layout_bpmn.py` owns geometry.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  id="Definitions_issuance" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_issuance">
    <bpmn:participant id="Participant_issuance" name="Certificate issuance"
                      processRef="issuance"/>
  </bpmn:collaboration>
  <bpmn:process id="issuance" isExecutable="true">
    <!-- Lane order is the order work flows through the roles. A reader scans
         top to bottom once and sees the hand-offs. -->
    <bpmn:laneSet id="LaneSet_issuance">
      <bpmn:lane id="Lane_applicant" name="Applicant">
        <bpmn:flowNodeRef>issuance_se_submitted_001</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>issuance_ut_revise_001</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>issuance_gw_choice_001</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>issuance_ee_withdrawn_001</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_evaluator" name="Evaluator">
        <bpmn:flowNodeRef>issuance_ut_verify_001</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>issuance_gw_verified_001</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>issuance_ee_issued_001</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="issuance_se_submitted_001" name="Application submitted">
      <bpmn:outgoing>Flow_to_verify</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:userTask id="issuance_ut_verify_001" name="Verify supporting documents">
      <bpmn:incoming>Flow_to_verify</bpmn:incoming>
      <bpmn:incoming>Flow_resubmit</bpmn:incoming>
      <bpmn:outgoing>Flow_to_decision</bpmn:outgoing>
    </bpmn:userTask>

    <!-- The gateway asks; each outgoing flow answers. A branch with no name
         forces every reader to guess, and they guess differently. -->
    <bpmn:exclusiveGateway id="issuance_gw_verified_001" name="Documents complete?"
                           default="Flow_incomplete">
      <bpmn:incoming>Flow_to_decision</bpmn:incoming>
      <bpmn:outgoing>Flow_complete</bpmn:outgoing>
      <bpmn:outgoing>Flow_incomplete</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:userTask id="issuance_ut_revise_001" name="Revise the application">
      <bpmn:incoming>Flow_incomplete</bpmn:incoming>
      <bpmn:outgoing>Flow_to_choice</bpmn:outgoing>
    </bpmn:userTask>

    <!-- A task with two outgoing flows splits implicitly, and bpmnlint errors
         on it (no-implicit-split): the branch condition lives nowhere a reader
         or an engine can see. Every choice gets its own gateway. -->
    <bpmn:exclusiveGateway id="issuance_gw_choice_001" name="Resubmit or withdraw?"
                           default="Flow_resubmit">
      <bpmn:incoming>Flow_to_choice</bpmn:incoming>
      <bpmn:outgoing>Flow_resubmit</bpmn:outgoing>
      <bpmn:outgoing>Flow_give_up</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <!-- One end event per outcome. A shared "End" erases the difference
         between succeeding and giving up, which is the fact worth keeping. -->
    <bpmn:endEvent id="issuance_ee_issued_001" name="Certificate issued">
      <bpmn:incoming>Flow_complete</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="issuance_ee_withdrawn_001" name="Application withdrawn">
      <bpmn:incoming>Flow_give_up</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="Flow_to_verify"   sourceRef="issuance_se_submitted_001" targetRef="issuance_ut_verify_001"/>
    <bpmn:sequenceFlow id="Flow_to_decision" sourceRef="issuance_ut_verify_001"    targetRef="issuance_gw_verified_001"/>
    <bpmn:sequenceFlow id="Flow_complete"    name="complete"            sourceRef="issuance_gw_verified_001" targetRef="issuance_ee_issued_001">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">=documents_complete = true</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
    <bpmn:sequenceFlow id="Flow_incomplete"  name="missing a document"  sourceRef="issuance_gw_verified_001" targetRef="issuance_ut_revise_001"/>
    <bpmn:sequenceFlow id="Flow_to_choice"                              sourceRef="issuance_ut_revise_001"   targetRef="issuance_gw_choice_001"/>
    <bpmn:sequenceFlow id="Flow_resubmit"    name="resubmitted"         sourceRef="issuance_gw_choice_001"   targetRef="issuance_ut_verify_001"/>
    <bpmn:sequenceFlow id="Flow_give_up"     name="withdrawn"           sourceRef="issuance_gw_choice_001"   targetRef="issuance_ee_withdrawn_001">
      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">=withdraw = true</bpmn:conditionExpression>
    </bpmn:sequenceFlow>
  </bpmn:process>
</bpmn:definitions>
```

Run through the pipeline this model lays out as 7 nodes over 2 lanes and lints
with **0 errors and 1 warning** — `fake-join` on `issuance_ut_verify_001`, which
has two incoming flows (first submission and resubmission) and no joining
gateway. That is the correct model here: verification runs on whichever arrives,
it never waits for both. Recording *that reasoning* is what the warning is for.

Note what the model does not do: it does not send both branches of a gateway to
one end event, it does not leave a conditionless branch undeclared as the
`default`, and it does not let a task carry two outgoing flows. The first draft
of this example did the last one, and the lint gate caught it.

## The five patterns

**1. Approval chain.** A `userTask` per approving role, each followed by its own
`exclusiveGateway` named for that role's decision. Do not merge two approvals
into one task: a single task cannot record which approver returned it.

**2. Revision loop.** The reject branch flows *back* to the task in the
requester's lane, and that task has a second outgoing flow to a `withdrawn` end
event. A loop with no exit is an infinite process, and the model is the cheapest
place to notice.

**3. Wait for an external system.** `serviceTask` (send the request) →
`intermediateCatchEvent` with `messageEventDefinition` (wait for the answer).
Attach a `boundaryEvent` with `timerEventDefinition` to the wait if the answer
may never come. Give the message a name that matches the real payload, and
correlate on a key both sides already have.

**4. Parallel review.** `parallelGateway` split → the concurrent tasks → a
second `parallelGateway` join. **Both are required.** Letting two flows arrive
at one task instead is what `bpmnlint` reports as `fake-join`, and the engine's
behaviour there is not what most authors expect.

**5. Escalation on a deadline.** `boundaryEvent` with `timerEventDefinition`
attached to the waiting task, flowing to the escalating role's task. Set
`cancelActivity="false"` when the original task should stay open, `true` when
the escalation replaces it — that attribute is the whole meaning of the pattern.

## What the lint gate cannot catch

`bpmnlint` checks the model's grammar. These are semantic, and they are yours:

| Error | Why lint misses it | How to catch it |
|---|---|---|
| A lane names a person, not a role | `Budi` is a valid string | Read the lane list aloud. Would it survive that person leaving? |
| A task hides a decision | `Process application` lints clean | Any task whose outcome changes the path needs a gateway after it |
| Branch labels are `yes`/`no` on a non-yes/no question | both are named | Make the gateway a question the labels actually answer |
| One end event for every outcome | one `endEvent` lints clean | Count the outcomes in the spec, then count the end events |
| The model omits an end state the spec has | the model is self-consistent | Trace each spec outcome to an `endEvent` id |
| Conditions reference variables nothing sets | expressions are not evaluated | Every variable in a `conditionExpression` is written by an earlier task |

The last row is the one that reaches production. A gateway that reads
`=is_approved = true` where no task ever sets `is_approved` is a process that
silently takes the default branch forever.
