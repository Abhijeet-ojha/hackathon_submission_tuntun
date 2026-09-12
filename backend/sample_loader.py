import os
from typing import List, Tuple
from .models import ResumeIntelligence, JDIntelligence
from .jd_intel.jd_parser import JDParser
from .ontology.skill_ontology import SkillOntology


SAMPLE_JD_FULLSTACK = """Job Title: Full-Stack Software Engineering Intern

About Us:
InternLoom is building next-generation developer productivity tools. We are looking for an ambitious Full-Stack Software Engineering Intern to join our core product team.

Responsibilities:
- Build responsive, accessible user interfaces using React.js and TypeScript.
- Design, implement, and maintain scalable REST APIs and microservices using Node.js and Express.
- Collaborate with database engineers to design schema models and optimize queries in PostgreSQL or MongoDB.
- Participate in code reviews, write comprehensive unit tests with Jest/Pytest, and implement CI/CD workflows using Git.
- Optimize frontend and backend performance for sub-second latency and high concurrency.

Requirements (Must-Have):
- Strong proficiency in JavaScript or TypeScript.
- Demonstrated experience building interactive frontend applications with React.js.
- Hands-on experience developing REST APIs using Node.js or backend frameworks.
- Familiarity with version control using Git.

Preferred Qualifications (Nice-to-Have):
- Experience with Next.js, Redux, or Tailwind CSS for modern UI design.
- Familiarity with Docker and containerization.
- Knowledge of relational or NoSQL databases (PostgreSQL, MongoDB).
- Basic understanding of CI/CD pipelines and automated testing.

Education & Experience:
- Currently pursuing a Bachelor's or Master's degree in Computer Science, Software Engineering, or related technical field.
- Graduating in 2025, 2026, or 2027.
"""

SAMPLE_JD_ML = """Job Title: Machine Learning Engineer Intern

About the Role:
We are seeking a Machine Learning Engineer Intern to build, fine-tune, and evaluate applied NLP and Computer Vision models.

Responsibilities:
- Develop, train, and benchmark machine learning models using Python and PyTorch or TensorFlow.
- Perform exploratory data analysis and data preprocessing using Pandas and NumPy.
- Implement evaluation pipelines using Scikit-Learn for precision, recall, and F1-score optimization.
- Package and deploy inference models using Docker and FastAPI.

Requirements (Must-Have):
- Strong programming skills in Python.
- Proven experience with PyTorch, TensorFlow, or Scikit-Learn.
- Solid foundation in Data Structures & Algorithms and Machine Learning fundamentals.

Nice-to-Have:
- Experience with Natural Language Processing (NLP), HuggingFace Transformers, or Computer Vision.
- Familiarity with Docker and Cloud platforms (AWS/GCP).
"""

SAMPLE_CANDIDATES_DATA = [
    {
        "id": "cand_01",
        "name": "Alex Rivera",
        "email": "alex.rivera@cs.edu",
        "phone": "+1-555-0101",
        "sections": {
            "profile": "Passionate full-stack developer with 2 internships building production web applications.",
            "education": "B.S. in Computer Science, Stanford University (GPA: 3.9/4.0, Expected May 2026)",
            "skills": "JavaScript, TypeScript, React.js, Next.js, Node.js, Express, REST APIs, PostgreSQL, MongoDB, Git, Docker, Tailwind CSS, Jest",
            "experience": "Software Engineer Intern at Stripe (Summer 2025)\n- Engineered high-throughput REST APIs using Node.js and TypeScript, handling 15,000 req/sec with 99.99% uptime.\n- Optimized PostgreSQL database indexing, reducing p95 query latency by 42% across 2M records.\n- Built automated CI/CD deployment pipelines using Git and GitHub Actions.",
            "projects": "DevPulse Analytics Dashboard (React.js, Node.js, TypeScript)\n- Developed real-time collaborative dashboard using React.js and Tailwind CSS, adopted by 8,500 active developers.\n- Implemented secure JWT authentication and RESTful API endpoints in Node.js and Express.\n- Achieved 95% test coverage using Jest and unit testing suites.",
            "certifications": "AWS Certified Cloud Practitioner",
            "achievements": "1st Place Winner, CalHacks 2024 (Team of 4, built AI workflow platform)"
        }
    },
    {
        "id": "cand_02",
        "name": "Sarah Chen",
        "email": "sarah.chen@gatech.edu",
        "phone": "+1-555-0102",
        "sections": {
            "profile": "Frontend specialist and TypeScript enthusiast focusing on performant UI architecture.",
            "education": "B.S. in Software Engineering, Georgia Tech (Expected Dec 2025)",
            "skills": "TypeScript, JavaScript, React.js, Redux Toolkit, Tailwind CSS, HTML5, CSS3, REST API, Git, Next.js, Jest",
            "experience": "Frontend Engineering Intern at Datadog\n- Architected reusable React.js component library in TypeScript, reducing UI code duplication by 35%.\n- Integrated REST APIs with Redux Toolkit for seamless state synchronization across 5 micro-frontends.\n- Accelerated initial page load speed by 280ms through code-splitting and asset optimization.",
            "projects": "OmniDocs Markdown Editor (React, TypeScript, Tailwind CSS)\n- Built collaborative rich-text editor supporting live preview and PDF exports with 10k+ downloads on GitHub.\n- Connected client to backend REST endpoints for cloud storage and version history.",
            "achievements": "Dean's List 4 Consecutive Semesters"
        }
    },
    {
        "id": "cand_03",
        "name": "Marcus Vance (Transferable Match)",
        "email": "marcus.vance@uwaterloo.ca",
        "phone": "+1-555-0103",
        "sections": {
            "profile": "Backend systems developer experienced in Express.js, MongoDB, and Python APIs.",
            "education": "B.S. in Computer Science, University of Waterloo (Expected 2026)",
            "skills": "JavaScript, Express.js, MongoDB, RESTful API, Python, FastAPI, Git, Docker, Linux, Mongoose",
            "experience": "Backend Developer Co-op at Shopify\n- Implemented 18 RESTful API services using Express.js and MongoDB for merchant inventory management.\n- Built asynchronous event queues reducing webhook delivery failure rates from 4.2% to 0.05%.\n- Maintained version control workflows with Git across a 12-person agile team.",
            "projects": "TaskFlow Microservices (Express.js, MongoDB, Docker)\n- Developed distributed backend with Express and MongoDB, handling 500,000 monthly active task updates.\n- Containerized microservices using Docker and orchestrated local cluster with docker-compose."
        }
    },
    {
        "id": "cand_04",
        "name": "Elena Rostova",
        "email": "elena.rostova@mit.edu",
        "phone": "+1-555-0104",
        "sections": {
            "profile": "Full-stack builder with strong foundations in React, Node, and relational databases.",
            "education": "M.S. in Computer Science, MIT (Expected June 2026); B.S. in CS, UIUC",
            "skills": "React.js, Node.js, JavaScript, TypeScript, REST APIs, PostgreSQL, Docker, Git, CI/CD, GraphQL",
            "experience": "Research Assistant, MIT CSAIL\n- Developed interactive visualization platform using React.js and TypeScript for graph neural network outputs.\n- Built high-performance Node.js backend streaming large JSON payloads over REST and WebSocket channels.",
            "projects": "CloudShelf E-Commerce (React, Node.js, PostgreSQL, Docker)\n- Built complete full-stack web application with cart management, Stripe payments, and admin panel.\n- Deployed containerized PostgreSQL and Node server on AWS EC2 with automated Git CI/CD pipelines."
        }
    },
    {
        "id": "cand_05",
        "name": "Devin Wright (Short Resume / Student Equity)",
        "email": "devin.w@purdue.edu",
        "phone": "+1-555-0105",
        "sections": {
            "profile": "Sophomore Computer Science student passionate about modern web tech.",
            "education": "B.S. in Computer Science, Purdue University (Expected May 2027)",
            "skills": "JavaScript, TypeScript, React.js, Node.js, REST API, Git, Tailwind CSS",
            "projects": "CampusEats Food Delivery (React.js, TypeScript, Node.js)\n- Built full-stack food ordering app used by 1,200 campus students during finals week.\n- Implemented Node.js REST API with 12 endpoints and responsive React frontend with Tailwind CSS."
        }
    },
    {
        "id": "cand_06",
        "name": "Priya Patel",
        "email": "priya.patel@utexas.edu",
        "phone": "+1-555-0106",
        "sections": {
            "profile": "Web engineer with emphasis on React, modern CSS, and REST API integration.",
            "education": "B.S. in Computer Science, UT Austin (Expected 2026)",
            "skills": "JavaScript, React.js, HTML5, CSS3, Tailwind CSS, REST APIs, Git, Next.js, Redux",
            "experience": "Frontend Intern at local software consultancy\n- Built customer-facing React components for 4 client portals, improving mobile accessibility scores to 98/100.\n- Consumed REST APIs and managed client-side cache using Redux.",
            "projects": "HealthTrack Fitness Portal (React, JavaScript, Tailwind)\n- Created single-page app displaying workout analytics and calorie logs with clean UI design."
        }
    },
    {
        "id": "cand_07",
        "name": "Liam Murphy (Java / Backend - Mismatch)",
        "email": "liam.murphy@illinois.edu",
        "phone": "+1-555-0107",
        "sections": {
            "profile": "Enterprise Java and Spring Boot engineer with strong backend and SQL skills.",
            "education": "B.S. in Computer Science, UIUC (Expected Dec 2025)",
            "skills": "Java, Spring Boot, SQL, PostgreSQL, MySQL, Docker, Git, JUnit, Microservices",
            "experience": "Backend Engineering Intern at State Farm\n- Built robust microservices using Java and Spring Boot for claims processing.\n- Wrote complex SQL queries and stored procedures in PostgreSQL.",
            "projects": "Banking Core Simulation (Java, Spring Boot, MySQL)\n- Developed transactional banking backend with Spring Boot, handling ACID transfers and JUnit test suites."
        }
    },
    {
        "id": "cand_08",
        "name": "Ananya Sharma",
        "email": "ananya.s@berkeley.edu",
        "phone": "+1-555-0108",
        "sections": {
            "profile": "Software engineering student with full-stack projects in React, Node, and MongoDB.",
            "education": "B.S. in Electrical Engineering & Computer Science, UC Berkeley (Expected 2026)",
            "skills": "JavaScript, TypeScript, React.js, Node.js, Express, MongoDB, REST API, Git, Docker, Python",
            "experience": "Undergraduate Teaching Assistant for CS61B Data Structures\n- Mentored 45 students in Java, Git, and algorithmic problem solving.\n- Designed automated grading scripts reducing grading turnaround time by 60%.",
            "projects": "PeerCode Collaborative IDE (React, Node.js, Express, MongoDB)\n- Created live pair-programming web app with React and Node.js REST API, supporting 300 concurrent users."
        }
    },
    {
        "id": "cand_09",
        "name": "Tariq Al-Mansoor (Python / ML - Mismatch for Web)",
        "email": "tariq.m@cmu.edu",
        "phone": "+1-555-0109",
        "sections": {
            "profile": "Machine learning researcher and Python programmer focusing on deep learning and NLP.",
            "education": "B.S. in Computer Science, Carnegie Mellon University (Expected 2026)",
            "skills": "Python, PyTorch, TensorFlow, Scikit-Learn, Pandas, NumPy, NLP, Computer Vision, Git, Linux",
            "experience": "ML Research Intern at CMU LTI\n- Fine-tuned transformer models using PyTorch for multilingual sentiment classification, improving F1 score to 0.89.\n- Processed 500,000 text documents using Pandas and NumPy.",
            "projects": "VisionTrack Object Detector (Python, PyTorch, OpenCV)\n- Trained custom YOLO object detection model on 20,000 images achieving 78% mAP."
        }
    },
    {
        "id": "cand_10",
        "name": "Chloe Dupont",
        "email": "chloe.d@umich.edu",
        "phone": "+1-555-0110",
        "sections": {
            "profile": "Junior full-stack developer with React and Node.js project experience.",
            "education": "B.S. in Computer Science, University of Michigan (Expected 2026)",
            "skills": "JavaScript, React.js, Node.js, REST API, Git, HTML, CSS, Bootstrap, SQL",
            "projects": "StudyBuddy Room Booking (React.js, Node.js, REST API)\n- Built room scheduling portal in React and Node.js used by 400 university students.\n- Configured Git version control and deployed application on Heroku."
        }
    },
    {
        "id": "cand_11",
        "name": "Jordan Brooks (Keyword Only / Low Evidence)",
        "email": "jordan.b@state.edu",
        "phone": "+1-555-0111",
        "sections": {
            "profile": "Hardworking student seeking software engineering internship opportunity.",
            "education": "B.S. in Information Technology, State University (Expected 2026)",
            "skills": "JavaScript, TypeScript, React.js, Node.js, REST API, Git, Docker, Kubernetes, AWS, Java, Python, C++, SQL",
            "experience": "IT Lab Assistant\n- Maintained computer lab equipment and assisted students with printer setup and password resets.",
            "projects": "Course Assignment 1\n- Completed homework assignments covering basic programming syntax."
        }
    },
    {
        "id": "cand_12",
        "name": "Carlos Gomez",
        "email": "carlos.g@ucla.edu",
        "phone": "+1-555-0112",
        "sections": {
            "profile": "Web developer with solid TypeScript, React, and REST API foundation.",
            "education": "B.S. in Computer Science, UCLA (Expected 2026)",
            "skills": "TypeScript, JavaScript, React.js, REST APIs, Git, PostgreSQL, Docker, Tailwind CSS, Jest",
            "experience": "Software Engineering Intern at Local Startup\n- Built 12 interactive React.js components in TypeScript for client onboarding dashboard.\n- Created REST API endpoints and optimized PostgreSQL queries, improving response time by 25%.",
            "projects": "EventHub Ticketing System (React, TypeScript, REST API, Git)\n- Developed full-stack ticketing prototype with QR code validation and Stripe test checkout."
        }
    },
    {
        "id": "cand_13",
        "name": "Aisha Khan",
        "email": "aisha.k@cornell.edu",
        "phone": "+1-555-0113",
        "sections": {
            "profile": "Software engineering student with React and API development experience.",
            "education": "B.S. in Computer Science, Cornell University (Expected Dec 2025)",
            "skills": "JavaScript, React.js, Node.js, REST API, Express, Git, MongoDB, Redux, HTML, CSS",
            "projects": "RecipeShare Social Network (React, Node.js, Express, MongoDB)\n- Built recipe sharing community with React frontend and Node/Express REST backend.\n- Implemented image upload and user follow mechanics for 800 active community members."
        }
    },
    {
        "id": "cand_14",
        "name": "Ethan Wright (Minimal Experience Student)",
        "email": "ethan.w@columbia.edu",
        "phone": "+1-555-0114",
        "sections": {
            "profile": "Freshman Computer Science student eager to learn fullstack development.",
            "education": "B.S. in Computer Science, Columbia University (Expected 2028)",
            "skills": "JavaScript, HTML5, CSS3, Git, Basic React",
            "projects": "Personal Portfolio Website (HTML, CSS, JavaScript)\n- Designed personal portfolio showcasing coursework and class projects, hosted via GitHub Pages."
        }
    },
    {
        "id": "cand_15",
        "name": "Scanned Resume Candidate (Edge Case)",
        "email": "",
        "phone": "",
        "sections": {
            "profile": "",
            "education": "",
            "skills": "",
            "experience": "",
            "internships": "",
            "projects": "",
            "certifications": "",
            "achievements": "",
            "other": ""
        },
        "raw_text": "",
        "status": "scanned_or_empty"
    },
    {
        "id": "cand_16",
        "name": "Corrupted PDF Sample (Edge Case)",
        "email": "",
        "phone": "",
        "sections": {
            "profile": "",
            "education": "",
            "skills": "",
            "experience": "",
            "internships": "",
            "projects": "",
            "certifications": "",
            "achievements": "",
            "other": ""
        },
        "raw_text": "",
        "status": "corrupted"
    }
]


def generate_sample_dataset() -> Tuple[JDIntelligence, List[ResumeIntelligence]]:
    ontology = SkillOntology()
    jd_parser = JDParser(ontology)
    jd = jd_parser.parse_jd(SAMPLE_JD_FULLSTACK)

    candidates: List[ResumeIntelligence] = []

    for item in SAMPLE_CANDIDATES_DATA:
        cand_id = item["id"]
        cand_name = item["name"]
        status = item.get("status", "success")

        if status != "success":
            cand_intel = ResumeIntelligence(
                candidate_id=cand_id,
                candidate_name=cand_name,
                parsing_status=status
            )
        else:
            raw_text = "\n".join([f"{k.upper()}:\n{v}" for k, v in item["sections"].items() if v])
            cand_intel = ResumeIntelligence(
                candidate_id=cand_id,
                candidate_name=cand_name,
                email=item.get("email", ""),
                phone=item.get("phone", ""),
                sections=item["sections"],
                raw_text=raw_text,
                parsing_status="success",
                word_count=len(raw_text.split())
            )

        candidates.append(cand_intel)

    return jd, candidates


def load_official_dataset(track: str = "web_sde") -> Tuple[JDIntelligence, List[ResumeIntelligence]]:
    """
    Loads and parses official dummy resumes from data/dummy_resumes_raw/Dummy Resumes/
    """
    import glob
    from .parsers.pdf_parser import PDFResumeParser
    
    ontology = SkillOntology()
    jd_parser = JDParser(ontology)
    parser = PDFResumeParser()
    
    if track == "ml":
        jd = jd_parser.parse_jd(SAMPLE_JD_ML)
        patterns = ["*ai_dev*", "*data_science*", "*Data_Science*", "*AI_*"]
    else:
        jd = jd_parser.parse_jd(SAMPLE_JD_FULLSTACK)
        patterns = ["*sde*", "*web_dev*", "*SDE_*", "*Web_*", "*App_*", "*app_dev*"]

    base_dir = os.path.join(os.path.dirname(__file__), "..", "data", "dummy_resumes_raw", "Dummy Resumes")
    if not os.path.exists(base_dir):
        # Fallback to standard generated dataset
        return generate_sample_dataset()

    found_files = []
    for pat in patterns:
        found_files.extend(glob.glob(os.path.join(base_dir, f"{pat}.pdf")))
        found_files.extend(glob.glob(os.path.join(base_dir, f"{pat}.docx")))

    # Deduplicate
    unique_files = list(dict.fromkeys(found_files))
    if not unique_files:
        return generate_sample_dataset()

    candidates: List[ResumeIntelligence] = []
    for idx, fpath in enumerate(unique_files[:20]):
        cand_id = f"cand_official_{idx+1:02d}"
        cand = parser.parse_text_or_pdf(fpath, cand_id)
        candidates.append(cand)

    return jd, candidates

