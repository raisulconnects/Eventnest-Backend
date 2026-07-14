import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import Event from "../models/Event";
import Review from "../models/Review";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");

    await Review.deleteMany({});
    await Event.deleteMany({});
    await User.deleteMany({});
    console.log("Cleared existing data");

    const users = await User.create([
      {
        name: "Demo User",
        email: "demo@eventnest.com",
        password: "demo123456",
        role: "user",
        avatar: "",
      },
      {
        name: "Admin User",
        email: "admin@eventnest.com",
        password: "admin123456",
        role: "admin",
        avatar: "",
      },
    ]);

    const demoUser = users[0];
    const adminUser = users[1];
    console.log("Created users");

    const events = await Event.create([
      {
        title: "Dhaka DevOps Meetup 2026",
        shortDescription:
          "Hands-on workshop on Kubernetes, CI/CD pipelines, and infrastructure as code.",
        fullDescription:
          "Dhaka DevOps Meetup 2026 brings together engineers, platform teams, and technology leaders for a practical day of learning and networking. The event will feature live sessions on Kubernetes operations, CI/CD strategy, observability, infrastructure as code, and real-world deployment stories from growing teams. Attendees will join technical talks, community discussions, and hands-on demonstrations designed to make modern DevOps concepts easier to apply in real production environments.",
        date: new Date("2026-08-15"),
        location: "Dhaka, Bangladesh",
        price: 0,
        category: "DevOps",
        images: [
          "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
        ],
        organizer: demoUser._id,
        capacity: 150,
        ratingAverage: 4.8,
      },
      {
        title: "AI/ML Bootcamp: Transformers in Practice",
        shortDescription:
          "Deep dive into transformer architectures, fine-tuning, and deployment.",
        fullDescription:
          "This bootcamp is designed for engineers and learners who want a practical introduction to modern transformer-based systems. Sessions cover model foundations, applied fine-tuning, evaluation, inference workflows, and deployment thinking for real product use cases. The format combines guided instruction with technical discussion, making it suitable for people who want both conceptual clarity and practical direction.",
        date: new Date("2026-09-10"),
        location: "Online",
        price: 25,
        category: "AI/ML",
        images: [
          "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
        ],
        organizer: demoUser._id,
        capacity: 500,
        ratingAverage: 4.9,
      },
      {
        title: "Cloud Native Builders Summit",
        shortDescription:
          "Talks on modern containers, microservices, and resilient deployment pipelines.",
        fullDescription:
          "Explore the latest in cloud-native architecture, container orchestration, microservices patterns, and resilient deployment strategies. This summit brings together cloud practitioners and platform engineers for a full day of technical sessions, networking, and hands-on labs. Learn from real-world case studies and discover new tools and techniques for building scalable, reliable systems.",
        date: new Date("2026-09-22"),
        location: "Singapore",
        price: 60,
        category: "Cloud",
        images: [
          "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
        ],
        organizer: adminUser._id,
        capacity: 240,
        ratingAverage: 4.6,
      },
      {
        title: "Frontend Systems Conference",
        shortDescription:
          "Design systems, performance, accessibility, and scalable frontend architecture.",
        fullDescription:
          "A practical event focused on building robust frontend systems. Sessions cover design system architecture, performance optimization, accessibility best practices, and scalable patterns for modern web applications. Whether you are building component libraries, optimizing Core Web Vitals, or architecting large-scale SPAs, this conference offers actionable insights and community connections.",
        date: new Date("2026-10-04"),
        location: "Kuala Lumpur, Malaysia",
        price: 40,
        category: "Web Development",
        images: [
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
        ],
        organizer: adminUser._id,
        capacity: 300,
        ratingAverage: 4.7,
      },
      {
        title: "Secure Code Workshop",
        shortDescription:
          "Security-focused workshop covering AppSec, threat modeling, secure coding, and common vulnerabilities.",
        fullDescription:
          "This hands-on workshop covers application security fundamentals including threat modeling, secure coding practices, OWASP Top 10 vulnerabilities, and practical remediation techniques. Participants will work through real-world scenarios and learn to identify and prevent common security issues in modern web applications.",
        date: new Date("2026-08-30"),
        location: "Chattogram, Bangladesh",
        price: 15,
        category: "Security",
        images: [
          "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
        ],
        organizer: demoUser._id,
        capacity: 80,
        ratingAverage: 4.5,
      },
      {
        title: "Mobile Dev Connect",
        shortDescription:
          "Sessions on Android, iOS, Flutter, React Native, and practical mobile performance tuning.",
        fullDescription:
          "Mobile Dev Connect brings together mobile developers across platforms for a day of talks, workshops, and networking. Topics include native and cross-platform development, mobile performance optimization, app architecture patterns, and the latest tools and frameworks shaping the mobile development landscape.",
        date: new Date("2026-09-14"),
        location: "Bangkok, Thailand",
        price: 30,
        category: "Mobile",
        images: [
          "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80",
        ],
        organizer: demoUser._id,
        capacity: 200,
        ratingAverage: 4.4,
      },
      {
        title: "Web Performance Lab",
        shortDescription:
          "Deep dives into Core Web Vitals, rendering performance, caching, and frontend optimization.",
        fullDescription:
          "A focused event on web performance engineering. Sessions cover Core Web Vitals measurement and improvement, rendering pipeline optimization, caching strategies, image optimization, and build-time performance. Leave with actionable techniques to make your web applications faster and more efficient.",
        date: new Date("2026-08-25"),
        location: "Online",
        price: 10,
        category: "Web Development",
        images: [
          "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
        ],
        organizer: demoUser._id,
        capacity: 400,
        ratingAverage: 4.6,
      },
      {
        title: "MLOps Community Day",
        shortDescription:
          "A focused event on model deployment, monitoring, reproducibility, and ML infrastructure.",
        fullDescription:
          "MLOps Community Day covers the intersection of machine learning and operations. Topics include model deployment pipelines, monitoring and observability for ML systems, experiment tracking, data versioning, and building reliable ML infrastructure. Learn from practitioners who have built and scaled ML platforms in production.",
        date: new Date("2026-10-12"),
        location: "Dhaka, Bangladesh",
        price: 20,
        category: "AI/ML",
        images: [
          "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80",
        ],
        organizer: adminUser._id,
        capacity: 180,
        ratingAverage: 4.8,
      },
      {
        title: "Platform Engineering Forum",
        shortDescription:
          "Talks on internal developer platforms, deployment velocity, developer experience, and tooling.",
        fullDescription:
          "Explore the world of platform engineering with talks on building internal developer platforms, improving deployment velocity, enhancing developer experience, and selecting the right tooling. This forum brings together platform teams and DevOps engineers to share knowledge and best practices.",
        date: new Date("2026-09-18"),
        location: "Singapore",
        price: 50,
        category: "DevOps",
        images: [
          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        ],
        organizer: demoUser._id,
        capacity: 150,
        ratingAverage: 4.7,
      },
      {
        title: "Cloud Security Roundtable",
        shortDescription:
          "A collaborative event around IAM, secrets management, container security, and zero-trust thinking.",
        fullDescription:
          "Join security professionals for a collaborative roundtable discussion on cloud security challenges. Topics include identity and access management, secrets management, container security, network policies, and implementing zero-trust architecture in cloud environments. This is a discussion-driven event with expert facilitation.",
        date: new Date("2026-10-08"),
        location: "Online",
        price: 0,
        category: "Security",
        images: [
          "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
        ],
        organizer: adminUser._id,
        capacity: 300,
        ratingAverage: 4.3,
      },
      {
        title: "Modern Backend Meetup",
        shortDescription:
          "API design, microservices tradeoffs, Node.js scaling, databases, and backend architecture discussions.",
        fullDescription:
          "A meetup for backend engineers discussing modern API design patterns, microservices vs monolith tradeoffs, Node.js scaling strategies, database selection and optimization, and overall backend architecture decisions. Bring your questions and experience for an engaging community discussion.",
        date: new Date("2026-08-21"),
        location: "Dhaka, Bangladesh",
        price: 5,
        category: "Web Development",
        images: [
          "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
        ],
        organizer: demoUser._id,
        capacity: 120,
        ratingAverage: 4.5,
      },
      {
        title: "Serverless Builders Night",
        shortDescription:
          "An evening event focused on serverless apps, edge functions, cloud integrations, and deployment speed.",
        fullDescription:
          "An evening event dedicated to serverless computing and edge functions. Sessions cover building serverless applications, leveraging edge computing for performance, cloud integrations, and rapid deployment strategies. Network with fellow builders and learn from production serverless implementations.",
        date: new Date("2026-09-28"),
        location: "Kuala Lumpur, Malaysia",
        price: 18,
        category: "Cloud",
        images: [
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
        ],
        organizer: demoUser._id,
        capacity: 200,
        ratingAverage: 4.4,
      },
    ]);
    console.log(`Created ${events.length} events`);

    const reviewsData = [
      {
        event: events[0]._id,
        user: adminUser._id,
        rating: 5,
        comment:
          "Excellent event structure and very practical sessions. I especially liked the Kubernetes deployment walkthrough.",
      },
      {
        event: events[0]._id,
        user: demoUser._id,
        rating: 4,
        comment:
          "Well organized and beginner friendly. I would love even more hands-on labs next time.",
      },
      {
        event: events[1]._id,
        user: adminUser._id,
        rating: 5,
        comment:
          "Strong content and very clear explanations. Great balance of theory and applied examples.",
      },
      {
        event: events[1]._id,
        user: demoUser._id,
        rating: 5,
        comment:
          "One of the best ML workshops I have attended. The transformer deep dive was exactly what I needed.",
      },
      {
        event: events[2]._id,
        user: demoUser._id,
        rating: 4,
        comment:
          "Great speakers and well-organized event. The container security session was particularly useful.",
      },
      {
        event: events[3]._id,
        user: demoUser._id,
        rating: 5,
        comment:
          "Fantastic conference with actionable insights. The design systems track was exceptional.",
      },
      {
        event: events[4]._id,
        user: adminUser._id,
        rating: 4,
        comment:
          "Very hands-on and practical. Learned several new security techniques I can apply immediately.",
      },
    ];

    const reviews = await Review.create(reviewsData);
    console.log(`Created ${reviews.length} reviews`);

    for (const review of reviews) {
      await Event.findByIdAndUpdate(review.event, {
        $push: { reviews: review._id },
      });
    }
    console.log("Updated events with review references");

    console.log("\nSeed completed successfully!");
    console.log("\nDemo credentials:");
    console.log("  User:  demo@eventnest.com / demo123456");
    console.log("  Admin: admin@eventnest.com / admin123456");

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seedData();
