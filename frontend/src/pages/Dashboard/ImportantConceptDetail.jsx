import { useMemo } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, Lightbulb } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import UserSidebarLayout from '../../components/Dashboard/UserSidebarLayout';
import { conceptsData } from '../../api/coursesData';

const conceptDetailContent = {
  'Operating Systems': {
    summary:
      'Operating Systems manage hardware resources, schedule processes, coordinate memory, and provide secure abstractions for applications to run efficiently.',
    sections: [
      {
        title: 'Process and Thread Scheduling',
        points: [
          'Understand FCFS, SJF, Round Robin, and priority scheduling tradeoffs.',
          'Know context switch cost and how scheduler quantum impacts responsiveness.',
          'Differentiate CPU-bound vs I/O-bound workloads for interview scenarios.',
        ],
      },
      {
        title: 'Memory Management',
        points: [
          'Explain paging, segmentation, TLB, and virtual memory flow clearly.',
          'Compare internal and external fragmentation with practical examples.',
          'Discuss page replacement strategies: FIFO, LRU, Optimal.',
        ],
      },
    ],
  },
  'Database Management': {
    summary:
      'DBMS concepts focus on data integrity, efficient storage, transaction guarantees, and query performance at scale.',
    sections: [
      {
        title: 'Transactions and Isolation',
        points: [
          'ACID properties are mandatory interview fundamentals.',
          'Be able to explain dirty reads, non-repeatable reads, and phantom reads.',
          'Map isolation levels to anomalies and practical tradeoffs.',
        ],
      },
      {
        title: 'Indexing and Query Design',
        points: [
          'Understand clustered vs non-clustered index behavior.',
          'Use composite indexes in correct column order for filtering/sorting.',
          'Interpret query plans to detect full scans and key lookups.',
        ],
      },
    ],
  },
  'Computer Networks': {
    summary:
      'Computer Networks are about reliable data exchange, protocol layering, latency control, and secure communication patterns.',
    sections: [
      {
        title: 'Transport and Reliability',
        points: [
          'Know TCP handshake, retransmission, and flow/congestion control basics.',
          'Understand when UDP is preferred over TCP (streaming, DNS, gaming).',
          'Explain how RTT impacts throughput and user experience.',
        ],
      },
      {
        title: 'Application Protocols',
        points: [
          'Compare HTTP/1.1, HTTP/2, and HTTP/3 strengths.',
          'Understand DNS resolution and caching behavior.',
          'Know TLS handshake purpose and certificate validation flow.',
        ],
      },
    ],
  },
  'System Design': {
    summary:
      'System Design emphasizes scalability, reliability, observability, and practical architecture decisions under constraints.',
    sections: [
      {
        title: 'Scaling Patterns',
        points: [
          'Horizontal scaling with stateless services and load balancing.',
          'Cache placement strategy: client, CDN, API, and database layers.',
          'Database partitioning/sharding when data and traffic grow.',
        ],
      },
      {
        title: 'Reliability Patterns',
        points: [
          'Use retries with backoff, circuit breakers, and timeouts.',
          'Design idempotent writes for distributed workflows.',
          'Monitor golden signals: latency, traffic, errors, saturation.',
        ],
      },
    ],
  },
  'Object Oriented Design': {
    summary:
      'OOD focuses on maintainable abstractions, low coupling, reusable components, and design patterns for evolving software.',
    sections: [
      {
        title: 'SOLID and Abstractions',
        points: [
          'Be ready to justify SRP and OCP with real code examples.',
          'Prefer interfaces and composition to reduce coupling.',
          'Use dependency inversion to improve testability.',
        ],
      },
      {
        title: 'Common Interview Patterns',
        points: [
          'Factory for object creation complexity.',
          'Strategy for runtime behavior changes.',
          'Observer for event-driven updates and notifications.',
        ],
      },
    ],
  },
  'Computer Architecture': {
    summary:
      'Computer Architecture explains how CPU, memory hierarchy, instruction flow, and parallelism influence performance.',
    sections: [
      {
        title: 'CPU and Pipeline Basics',
        points: [
          'Understand instruction cycle and pipelining stages.',
          'Explain hazards: data, control, and structural.',
          'Know branch prediction and why misprediction is expensive.',
        ],
      },
      {
        title: 'Memory Hierarchy',
        points: [
          'Registers > cache > RAM > disk latency ladder.',
          'Cache locality (temporal/spatial) drives performance gains.',
          'Understand cache miss penalties and practical optimization.',
        ],
      },
    ],
  },
};

const getFallbackDetail = (title) => ({
  summary:
    `${title} is a core interview area. Use this mock page to structure your study around fundamentals, tradeoffs, and practical examples.`,
  sections: [
    {
      title: 'Core Fundamentals',
      points: [
        'Build strong conceptual clarity before solving advanced questions.',
        'Practice short explanations that communicate tradeoffs clearly.',
        'Use example scenarios to make answers interview-ready.',
      ],
    },
    {
      title: 'Interview Readiness',
      points: [
        'Prepare a 1-2 minute summary for each major subtopic.',
        'Maintain a revision checklist and quick notes for weak areas.',
        'Pair theory revision with targeted mock questions.',
      ],
    },
  ],
});

export default function ImportantConceptDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { conceptId } = useParams();

  const isDashboardContext = location.pathname.startsWith('/dashboard/resources/important-concepts/');
  const concept = useMemo(
    () => conceptsData.find((item) => String(item.id) === String(conceptId)) || null,
    [conceptId]
  );

  const detail = concept
    ? conceptDetailContent[concept.title] || getFallbackDetail(concept.title)
    : null;

  const backPath = isDashboardContext
    ? '/dashboard/resources/important-concepts'
    : '/core-prep/important-concepts';

  if (!concept || !detail) {
    return (
      <UserSidebarLayout maxWidthClass="max-w-5xl">
        <div className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 text-lg font-semibold text-[#8fd9ff] transition hover:text-[#a8e6ff]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to concepts
          </button>
          <p className="mt-4 text-[#0d2a57] dark:text-[#8fd9ff]">Concept not found.</p>
        </div>
      </UserSidebarLayout>
    );
  }

  return (
    <UserSidebarLayout maxWidthClass="max-w-5xl">
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/95 to-[#d9efff]/90 p-6 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
          <button
            type="button"
            onClick={() => navigate(backPath)}
            className="inline-flex items-center gap-2 text-lg font-semibold text-[#8fd9ff] transition hover:text-[#a8e6ff]"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to concepts
          </button>

          <div className="mt-4 flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-semibold"
              style={{
                color: concept.color,
                borderColor: `${concept.color}55`,
                backgroundColor: `${concept.color}1f`,
              }}
            >
              {concept.icon}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#0d2a57] dark:text-[#8fd9ff] md:text-3xl">{concept.title}</h1>
              <p className="mt-2 text-sm text-[#4c6f9a] dark:text-[#7fb8e2] md:text-base">{detail.summary}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {detail.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-5 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70"
            >
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#86c4ff]/40 bg-[#dbf1ff] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#2d7fe8] dark:border-[#6fbfff]/35 dark:bg-[#0d366f] dark:text-[#8fd9ff]">
                <Lightbulb className="h-3.5 w-3.5" />
                {section.title}
              </div>

              <ul className="space-y-2">
                {section.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-[#3d618e] dark:text-[#7fb8e2]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2d7fe8] dark:text-[#8fd9ff]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="rounded-2xl border border-[#86c4ff]/40 bg-gradient-to-br from-[#e7f6ff]/90 to-[#d9efff]/85 p-5 shadow-[0_12px_34px_rgba(60,131,246,0.12)] dark:border-[#6fbfff]/30 dark:from-[#052152]/75 dark:to-[#072b63]/70">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#86c4ff]/40 bg-[#dbf1ff] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#2d7fe8] dark:border-[#6fbfff]/35 dark:bg-[#0d366f] dark:text-[#8fd9ff]">
            <BookOpen className="h-3.5 w-3.5" />
            Quick Revision Prompt
          </div>
          <p className="mt-3 text-sm text-[#3d618e] dark:text-[#7fb8e2]">
            Explain {concept.title} in 2 minutes covering: core definition, one practical use case, one common pitfall, and one optimization/tradeoff.
          </p>
        </section>
      </div>
    </UserSidebarLayout>
  );
}
