from services.ollama_client import OllamaClient

async def validate_educational_topic(topic: str) -> bool:
    allowed_domains = """
1. School Education: Mathematics, Science, Physics, Chemistry, Biology, English, Grammar, Literature, Social Studies, History, Geography, Civics, Economics, Environmental Science, Computer Basics, General Knowledge
2. College Education & Engineering Branches: Engineering, Medical Subjects, Pharmacy, Nursing, Law, Commerce, Arts, Management, Business Administration, Architecture, Agriculture, Biotechnology, Statistics, Psychology, Sociology, Philosophy, Mechanical, Civil, Electrical, Electronics & Communication, Chemical, Aerospace, Automobile
3. Computer Science & IT: Programming, Python, Java, C, C++, C#, JavaScript, TypeScript, Go, Rust, Kotlin, Swift, PHP, Ruby, R Programming, SQL, HTML, CSS, React, Angular, Vue, Node.js, Express.js, Django, Flask, FastAPI, Spring Boot, ASP.NET, Operating Systems, Computer Networks, DBMS, Data Structures, Algorithms, Compiler Design, Digital Logic, Microprocessors, Embedded Systems, Cloud Computing, Distributed Systems, Cybersecurity, Cryptography
4. AI & Data Science: Artificial Intelligence, Machine Learning, Deep Learning, Neural Networks, NLP, Computer Vision, Generative AI, LLMs, Prompt Engineering, AI Ethics, Reinforcement Learning, Data Mining, Recommendation Systems, Data Analysis, Data Visualization, Probability, Pandas, NumPy, Matplotlib, Power BI, Tableau, Excel, Data Cleaning, Feature Engineering
5. Software Engineering: SDLC, Agile, Scrum, DevOps, Git, GitHub, Docker, Kubernetes, CI/CD, Software Testing, Unit Testing, API Development, REST APIs, GraphQL
6. Mathematics & Science: Algebra, Geometry, Trigonometry, Calculus, Linear Algebra, Discrete Mathematics, Numerical Methods, Mechanics, Electricity, Magnetism, Optics, Thermodynamics, Modern Physics, Organic Chemistry, Inorganic Chemistry, Physical Chemistry, Analytical Chemistry, Botany, Zoology, Genetics, Microbiology, Human Anatomy, Ecology
7. Commerce: Accounting, Financial Accounting, Cost Accounting, Auditing, Taxation, Business Studies, Banking, Insurance, Marketing, Human Resource Management
8. Academic Support & Learning Assistance: Homework Help, Assignments, Projects, Lab Experiments, Case Studies, Explain Concepts, Solve Problems, Step-by-Step Solutions, Code Explanation, Formula Explanation, Algorithm Explanation, Diagram Explanation, Compare Concepts, Examples, Practice Questions, Revision Tips
9. Language Learning: English Grammar, Vocabulary, Reading Comprehension, Essay Writing, Letter Writing, Technical Writing, Spoken English, Academic English, Translation
10. Educational Documents: Textbooks, Lecture Notes, Class Notes, Study Materials, Lab Manuals, Academic PDFs, Educational Presentations
"""

    # Clean up common conversational prefixes
    clean_topic = topic.lower()
    prefixes_to_remove = [
        "create about", "write a note on", "generate flashcards for",
        "tell me about", "what is", "explain", "generate about", "write about", "create notes for"
    ]
    for prefix in prefixes_to_remove:
        if clean_topic.startswith(prefix):
            clean_topic = clean_topic[len(prefix):].strip()

    # Use a Chain-of-Thought prompt for robust validation
    validation_prompt = (
        f"You are a strict academic filter. Analyze the user request below.\n"
        f"1. Identify the core subject matter, ignoring conversational words like 'give me a quiz on' or 'create flashcards for'.\n"
        f"2. Determine if the core subject is a serious academic subject, field of study, technology, science, history, or professional skill.\n"
        f"3. Determine if it is purely entertainment, pop culture, anime, movies, sports, gossip, or politics/current events.\n"
        f"4. Finally, on a new line, output exactly 'RESULT: YES' if it is academic/professional, or 'RESULT: NO' if it is entertainment/non-educational.\n\n"
        f"User Request: '{topic}'\n"
    )
    
    client = OllamaClient()
    try:
        validation_response = await client.generate(prompt=validation_prompt)
        print("VALIDATION RESPONSE:", validation_response)
        return "RESULT: YES" in validation_response.upper()
    except Exception:
        return True # Fallback to true if validation fails
