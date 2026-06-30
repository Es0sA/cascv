/* ============================================================
   CAS Writing Services — ATS Keyword Database v3
   3-tier structure per role:
     critical      → non-negotiable role-defining skills (5pts each)
     technical     → specific hard skills, tools, methodologies (2pts each)
     certifications→ formal qualifications (4pts each if in JD)
   
   Rules: NO generic words. NO soft skills. Only specific,
   measurable, role-relevant terms an ATS actually scans for.
   68 categories · 250+ job title variants.
   ============================================================ */

const ROLE_DATABASE = {

  sales: {
    name: "Sales & Business Development",
    titles: ["sales executive","sales representative","sales officer","sales manager","business development manager","account manager","bdm","territory sales","field sales","regional sales manager","key account manager","sales engineer","commercial officer","business development officer","van sales","channel sales","sales coordinator"],
    critical: ["revenue generation","lead generation","business development","client acquisition","pipeline management","sales strategy","account management","deal closing","target achievement","market penetration","customer acquisition","revenue growth"],
    technical: ["CRM","salesforce","zoho","hubspot","cold calling","B2B","B2C","FMCG","sales forecasting","proposal writing","contract negotiation","upselling","cross-selling","channel distribution","key account management","tender management","sales analytics","quota management","territory planning","product demonstration","sales presentation","market mapping"],
    certifications: ["ISMM","certified sales professional","CSP","SPIN selling"]
  },

  telemarketing: {
    name: "Telemarketing & Inside Sales",
    titles: ["telemarketer","inside sales","telesales executive","outbound sales agent","telesales officer","lead generation officer","telephone sales officer"],
    critical: ["outbound calls","lead generation","cold calling","telesales","conversion rate","call targets","sales pitch","customer acquisition"],
    technical: ["CRM","power dialer","predictive dialer","call recording","script adherence","objection handling","lead qualification","sales funnel","follow-up management","call monitoring","daily call logs"],
    certifications: []
  },

  customer_service: {
    name: "Customer Service & Support",
    titles: ["customer service officer","customer support agent","customer care representative","client relations officer","customer success manager","contact centre agent","call centre agent","helpdesk agent","service desk officer","customer experience officer","cx agent","customer relations officer"],
    critical: ["complaint resolution","customer retention","query resolution","first call resolution","customer satisfaction","SLA adherence","escalation management","customer engagement","service delivery"],
    technical: ["zendesk","freshdesk","intercom","salesforce service cloud","ticketing system","CRM","live chat","NPS","CSAT","call centre software","knowledge base","customer feedback","customer onboarding","inbound calls","outbound calls"],
    certifications: ["CCXP","HDI","COPC"]
  },

  admin: {
    name: "Administration & Office Management",
    titles: ["administrative officer","administrator","admin officer","office manager","executive assistant","personal assistant","PA","EA","office administrator","operations officer","admin executive","secretary","receptionist","front desk officer","clerical officer","admin assistant","corporate administrator"],
    critical: ["calendar management","correspondence management","record keeping","documentation","filing systems","scheduling","office coordination","report preparation","vendor management"],
    technical: ["microsoft office","google workspace","SharePoint","zoom","slack","data entry","travel coordination","minute taking","petty cash management","procurement coordination","office supplies management","expense reporting","errand management","document management system"],
    certifications: ["IAAP certified administrative professional","microsoft office specialist"]
  },

  teaching: {
    name: "Teaching & Education",
    titles: ["teacher","tutor","educator","lecturer","instructor","class teacher","subject teacher","primary school teacher","secondary school teacher","nursery teacher","kindergarten teacher","STEM teacher","mathematics teacher","english teacher","science teacher","computer teacher","special needs teacher","academic coordinator","curriculum developer"],
    critical: ["lesson planning","curriculum delivery","classroom management","student assessment","learning outcomes","lesson delivery","subject knowledge","scheme of work","differentiated instruction"],
    technical: ["WAEC","NECO","cambridge curriculum","IGCSE","british curriculum","e-learning","LMS","formative assessment","summative assessment","student records management","report writing","parent communication","behaviour management","educational technology","IEP","remedial teaching","montessori method"],
    certifications: ["TRCN","PGDE","B.Ed","NCE","TEFL","TESOL","qualified teacher status","NTI"]
  },

  school_admin: {
    name: "School Administration",
    titles: ["school administrator","academic registrar","school secretary","school bursar","class administrator","admissions officer","school operations officer","timetable officer","examination officer","students affairs officer"],
    critical: ["student records management","admissions processing","academic documentation","timetable scheduling","examination administration","school database management","fee collection"],
    technical: ["school management system","student information system","WAEC registration","NECO registration","result computation","school fees tracking","report cards","parent communication portal","attendance system"],
    certifications: []
  },

  accounting: {
    name: "Accounting & Finance",
    titles: ["accountant","finance officer","accounts officer","financial analyst","bookkeeper","accounting officer","finance manager","treasury officer","cost accountant","management accountant","senior accountant","finance executive","budget officer","cashier","accounts assistant","finance analyst","financial controller"],
    critical: ["financial reporting","bank reconciliation","financial statements","accounts payable","accounts receivable","general ledger","payroll processing","tax computation","budget preparation","cash flow management","financial analysis","journal entries","trial balance"],
    technical: ["quickbooks","sage","SAP","tally","microsoft excel","IFRS","GAAP","VAT returns","PAYE","withholding tax","management accounts","fixed assets register","ERP","financial modelling","variance analysis","internal controls","PENCOM","LIRS","FIRS","WHT","profit and loss","balance sheet"],
    certifications: ["ICAN","ACCA","CPA","CFA","ACA","CIMA","FCA","ACA","CFA level 1","AAT"]
  },

  audit: {
    name: "Audit & Risk Management",
    titles: ["internal auditor","external auditor","risk officer","risk manager","audit officer","compliance auditor","financial auditor","forensic auditor","risk analyst","internal control officer","audit manager"],
    critical: ["audit planning","audit execution","internal controls testing","risk assessment","compliance review","audit report writing","working papers","control weaknesses","audit findings","fraud detection"],
    technical: ["ACL","IDEA","data analytics audit","risk register","COSO framework","audit software","ISO 31000","sox compliance","control self-assessment","process mapping","sampling methodology","audit committee reporting","segregation of duties"],
    certifications: ["CIA","CISA","ICAN","ACCA","CFE","CRMA","CGAP","ACA"]
  },

  hr: {
    name: "Human Resources",
    titles: ["HR officer","human resources officer","HR manager","HR executive","HR generalist","HR business partner","talent acquisition specialist","recruitment officer","recruiter","HRBP","HR administrator","learning and development officer","compensation and benefits officer","HR coordinator","people operations officer"],
    critical: ["recruitment","talent acquisition","onboarding","performance management","payroll administration","employee relations","HR policy implementation","workforce planning","disciplinary procedures","grievance handling","job evaluation"],
    technical: ["HRIS","ATS","bamboohr","SAP HR","oracle HCM","job description writing","salary benchmarking","competency framework","succession planning","training needs analysis","employee engagement surveys","exit interview","headcount planning","job grading","HR analytics","people analytics"],
    certifications: ["CIPM","SHRM-CP","SHRM-SCP","CIPD level 3","CIPD level 5","HRCI","PHR","SPHR","NIM"]
  },

  marketing: {
    name: "Marketing & Digital Marketing",
    titles: ["marketing officer","marketing manager","digital marketing officer","brand manager","marketing executive","social media manager","content marketing officer","growth marketer","marketing communications officer","product marketing manager","marketing specialist","marketing coordinator","brand executive","marketing analyst","CMO"],
    critical: ["campaign management","brand management","digital marketing","content strategy","market research","ROI measurement","lead generation","customer acquisition","brand awareness","go-to-market strategy"],
    technical: ["google analytics","meta ads manager","google ads","email marketing","mailchimp","klaviyo","SEO","SEM","PPC","hubspot","A/B testing","marketing automation","social media management","canva","adobe creative suite","hootsuite","buffer","market segmentation","competitor analysis","content calendar","editorial calendar","ATL","BTL"],
    certifications: ["google analytics certification","google ads certification","HubSpot certification","meta blueprint","CIM","NIMN","digital marketing institute"]
  },

  social_media: {
    name: "Social Media & Content Creation",
    titles: ["social media officer","social media manager","content creator","content manager","social media executive","community manager","digital content officer","social media strategist","content writer digital","social media coordinator"],
    critical: ["content creation","social media strategy","community management","content calendar","audience growth","engagement rate","platform management","content scheduling","social media analytics"],
    technical: ["meta business suite","instagram","facebook","twitter/X","linkedin","tiktok","youtube","canva","capcut","hootsuite","buffer","later","sprout social","social listening","hashtag strategy","reels production","stories","influencer outreach","paid social","reach and impressions","content repurposing"],
    certifications: ["meta blueprint","HubSpot social media certification","hootsuite certification"]
  },

  it: {
    name: "Information Technology & Software Development",
    titles: ["software developer","software engineer","IT officer","systems administrator","network engineer","IT support officer","web developer","data engineer","devops engineer","cloud engineer","IT manager","full stack developer","backend developer","frontend developer","mobile developer","IT technician","systems analyst","database administrator","IT consultant"],
    critical: ["software development","system administration","database management","network administration","troubleshooting","API development","system design","infrastructure management","IT security"],
    technical: ["python","javascript","java","C#","SQL","react","node.js","angular","vue.js","AWS","azure","google cloud","docker","kubernetes","linux","windows server","git","CI/CD","HTML","CSS","PHP","MySQL","postgresql","mongodb","REST API","graphQL","microservices","agile","scrum","JIRA","flutter","swift","kotlin","terraform","ansible","jenkins"],
    certifications: ["AWS certified","azure certified","google cloud certified","CCNA","MCSE","CompTIA A+","CompTIA Network+","ITIL foundation","PMP","oracle certified","red hat certified"]
  },

  cybersecurity: {
    name: "Cybersecurity & Information Security",
    titles: ["cybersecurity officer","information security officer","security analyst","network security engineer","SOC analyst","penetration tester","information security manager","cyber analyst","security engineer"],
    critical: ["vulnerability assessment","penetration testing","incident response","threat detection","security monitoring","network security","data protection","security auditing","risk assessment"],
    technical: ["SIEM","splunk","IBM QRadar","firewall management","IDS/IPS","endpoint security","cloud security","identity and access management","zero trust","ethical hacking","malware analysis","OWASP","ISO 27001","NDPR","GDPR","nmap","metasploit","wireshark","vulnerability scanning","security operations centre"],
    certifications: ["CISSP","CEH","CompTIA Security+","CISM","CISA","OSCP","GIAC","eJPT"]
  },

  nursing: {
    name: "Nursing & Patient Care",
    titles: ["registered nurse","staff nurse","nursing officer","community nurse","ward nurse","theatre nurse","ICU nurse","pediatric nurse","midwife","nursing sister","head nurse","matron","nursing tutor"],
    critical: ["patient assessment","medication administration","vital signs monitoring","wound care","care plan development","infection control","patient safety","clinical documentation","emergency response","IV therapy"],
    technical: ["BLS","ACLS","triage","patient handover","drug calculation","nasogastric tube","catheterisation","venepuncture","CPAP","ECG monitoring","fluid balance","blood transfusion","maternal care","neonatal care","ward rounds","EHR","EMR","NHIS documentation"],
    certifications: ["NMC registration","RN","BNSc","post-basic nursing","midwifery certificate","SSNC","NNMP"]
  },

  doctor: {
    name: "Medical Doctor & Physician",
    titles: ["medical officer","physician","general practitioner","GP","clinical officer","medical director","house officer","resident doctor","consultant","specialist physician","surgeon","paediatrician","gynaecologist","cardiologist","radiologist"],
    critical: ["clinical diagnosis","patient management","treatment planning","prescription writing","clinical documentation","patient history taking","physical examination","differential diagnosis","clinical decision making"],
    technical: ["ICD-10 coding","EMR","EHR","surgical procedures","ultrasound interpretation","ECG interpretation","drug management","clinical protocols","WHO guidelines","NHIS billing","referral management","ward rounds","outpatient clinic","emergency management","sepsis protocol"],
    certifications: ["MDCN registration","MBBS","MBChB","FMCP","FWACS","West African College","fellowship","medical licence"]
  },

  pharmacy: {
    name: "Pharmacy",
    titles: ["pharmacist","pharmaceutical officer","retail pharmacist","hospital pharmacist","clinical pharmacist","pharmacy technician","drug information officer"],
    critical: ["drug dispensing","prescription verification","drug interaction checking","patient counselling","drug inventory management","pharmacovigilance","prescription filling","stock management"],
    technical: ["NAFDAC regulations","cold chain management","pharmaceutical compounding","drug storage standards","pharmacy management system","narcotic register","drug expiry management","drug procurement","generic substitution","clinical pharmacy services","hospital formulary","drug therapy monitoring"],
    certifications: ["PCN registration","B.Pharm","Pharm.D","fellowship CIPN","NAFDAC registration"]
  },

  medical_lab: {
    name: "Medical Laboratory Science",
    titles: ["medical laboratory scientist","laboratory officer","lab scientist","medical laboratory technician","lab analyst","laboratory manager","pathology officer","microbiologist","haematologist","clinical chemist"],
    critical: ["specimen analysis","quality control","results reporting","laboratory safety","microscopy","sample collection","diagnostic testing","laboratory equipment operation","biosafety procedures"],
    technical: ["PCR","ELISA","culture and sensitivity","urinalysis","full blood count","blood grouping","cross matching","CD4 count","HIV rapid test","malaria RDT","clinical chemistry","HPLC","spectrophotometry","LIS","LIMS","ISO 15189","proficiency testing","reagent management"],
    certifications: ["MLSCN registration","BMLS","fellowship of ICSL","ISO 15189 auditor"]
  },

  public_health: {
    name: "Public Health & Community Health",
    titles: ["public health officer","community health officer","community health worker","health educator","epidemiologist","disease surveillance officer","health promotion officer","environmental health officer","immunisation officer","health programme officer"],
    critical: ["community mobilisation","disease surveillance","immunisation programme","health education delivery","data collection","outbreak investigation","health promotion","stakeholder engagement"],
    technical: ["DHIS2","KOBO toolbox","ODK","epidemiological analysis","contact tracing","cold chain","MNCH","RMNCH","malaria control","TB programme","HIV/AIDS management","WASH","nutrition programme","USAID reporting","NHIS coordination","vital registration"],
    certifications: ["MPH","FPHA","public health fellowship","NPHCDA certification","FMOH training certificate"]
  },

  banking: {
    name: "Banking & Financial Services",
    titles: ["relationship manager","bank officer","credit analyst","loan officer","treasury officer","trade finance officer","retail banking officer","corporate banking officer","branch manager","operations officer","teller","bank manager","digital banking officer"],
    critical: ["deposit mobilisation","credit analysis","loan appraisal","account opening","KYC compliance","AML compliance","customer relationship management","financial analysis","loan portfolio management","credit risk assessment"],
    technical: ["finacle","temenos","flexcube","SWIFT","RTGS","NIP","NIBSS","trade finance","letters of credit","bank guarantee","forex trading","treasury operations","CBN regulations","NDIC guidelines","loan restructuring","collateral management","credit bureau","CRC","FirstCentral","financial modelling"],
    certifications: ["ACIB","CIBN","CFA","ACA","FRM","CAMS","CFE","banking diploma"]
  },

  microfinance: {
    name: "Microfinance & Cooperative",
    titles: ["loan officer","credit officer","microfinance officer","field officer","loan supervisor","credit manager","microfinance bank officer","cooperative officer","savings and credit officer"],
    critical: ["loan disbursement","credit assessment","loan recovery","client verification","loan appraisal","portfolio at risk management","group lending","savings mobilisation","field collection"],
    technical: ["loan tracking software","PAR calculation","provisioning","write-off management","guarantor assessment","collateral evaluation","group dynamics","centre meetings","repayment schedule","delinquency management","microloan products","CBN microfinance guidelines","cooperative management"],
    certifications: ["microfinance certification","LAPO training","NIRSAL certification","CBN microfinance licence"]
  },

  insurance: {
    name: "Insurance & Underwriting",
    titles: ["insurance officer","underwriter","claims officer","insurance sales officer","insurance agent","insurance broker","actuary","loss adjuster","reinsurance officer","bancassurance officer","insurance manager"],
    critical: ["underwriting","policy issuance","claims assessment","risk evaluation","premium calculation","policy renewal","client acquisition","loss adjustment","reinsurance placement"],
    technical: ["NAICOM regulations","policy documentation","marine insurance","motor insurance","life insurance","health insurance","fire insurance","liability insurance","actuarial tables","claims software","insurance portal","premium computation","NIA guidelines","excess and deductibles","subrogation"],
    certifications: ["CIIN","ACII","FCII","actuarial science","NIA certification","AIICO","AXA Mansard training"]
  },

  logistics: {
    name: "Logistics, Supply Chain & Operations",
    titles: ["logistics officer","supply chain manager","warehouse manager","operations manager","store keeper","fleet manager","dispatch officer","inventory officer","transport officer","distribution officer","logistics manager","shipping officer","stock controller","supply officer"],
    critical: ["inventory management","warehouse management","stock control","order fulfillment","fleet management","route planning","procurement","vendor management","distribution management","supply chain planning"],
    technical: ["SAP ERP","oracle SCM","warehouse management system","WMS","barcode scanning","RFID","last-mile delivery","3PL management","customs documentation","incoterms","bill of lading","freight forwarding","cold chain","FIFO","FEFO","demand forecasting","ERP","route optimisation","fleet tracking","GPS tracking"],
    certifications: ["CIPS","CILT","APICS","SCPro","CSCP","CPIM","logistics certification","import export licence"]
  },

  transport: {
    name: "Transport & Driving",
    titles: ["professional driver","chauffeur","truck driver","bus driver","delivery driver","logistics driver","dispatch rider","heavy duty driver","long distance driver","fleet driver","vehicle operator"],
    critical: ["defensive driving","route knowledge","vehicle maintenance","traffic regulation compliance","cargo safety","timekeeping","load management","passenger safety"],
    technical: ["GPS navigation","vehicle log maintenance","fuel management","trip reporting","daily vehicle inspection","DV roadworthiness","highway code","goods vehicle operation","tachograph","load securing","hazmat transport"],
    certifications: ["valid drivers licence","LASDRI card","FRSC licence","vehicle inspection certificate","heavy duty vehicle licence","C&E licence"]
  },

  project_management: {
    name: "Project Management",
    titles: ["project manager","project coordinator","program manager","PMO officer","project officer","project lead","implementation manager","programme officer","project administrator","M&E officer","delivery manager","project planner"],
    critical: ["project planning","scope management","stakeholder management","risk management","budget management","schedule management","milestone tracking","project reporting","change management","resource allocation"],
    technical: ["MS project","asana","trello","jira","monday.com","project charter","WBS","gantt chart","earned value management","RACI matrix","risk register","project dashboard","lessons learned","kickoff meetings","project closure","sprint planning","velocity tracking","burndown chart"],
    certifications: ["PMP","PRINCE2","CAPM","PMI-ACP","agile certification","scrum master","six sigma green belt","six sigma black belt"]
  },

  data_analysis: {
    name: "Data Analysis & Business Intelligence",
    titles: ["data analyst","data scientist","business analyst","BI analyst","data officer","reporting analyst","MIS officer","data manager","research analyst","insights analyst","data engineer","analytics officer","database analyst"],
    critical: ["data analysis","data visualisation","SQL queries","dashboard development","data cleaning","reporting","statistical analysis","KPI tracking","database management","insight generation"],
    technical: ["python","R","power BI","tableau","google data studio","looker","SPSS","excel advanced","pivot tables","vlookup","SQL","MySQL","postgresql","mongodb","ETL pipeline","machine learning","predictive modelling","regression analysis","A/B testing","data warehousing","big data","Hadoop","spark","google analytics","mixpanel"],
    certifications: ["google data analytics certification","IBM data analyst","microsoft power BI","tableau desktop specialist","AWS data analytics","azure data scientist"]
  },

  market_research: {
    name: "Market Research & Consumer Insights",
    titles: ["market research officer","research analyst","consumer insights officer","market intelligence officer","field researcher","survey officer","research associate","qualitative researcher","quantitative researcher"],
    critical: ["research design","data collection","survey administration","focus group facilitation","competitive analysis","consumer behaviour analysis","market intelligence","research reporting"],
    technical: ["SPSS","STATA","NVivo","KOBO toolbox","ODK","CAPI","CAWI","questionnaire design","sampling methodology","brand tracking","retail audit","mystery shopping","Nielsen methodology","data validation","cross-tabulation","sentiment analysis","research panel"],
    certifications: ["MRS certificate","ESOMAR membership","NIMRS certification","market research society"]
  },

  legal: {
    name: "Legal & Compliance",
    titles: ["lawyer","legal officer","legal counsel","compliance officer","legal advisor","solicitor","barrister","legal executive","company secretary","corporate secretary","paralegal","legal manager","compliance manager","regulatory officer","legal associate"],
    critical: ["contract drafting","legal research","due diligence","regulatory compliance","litigation management","legal advisory","corporate governance","company secretarial","legal documentation","dispute resolution"],
    technical: ["CAMA 2020","SEC regulations","CBN circulars","FIRS guidelines","EFCC act","consumer protection","intellectual property","employment law","arbitration","mediation","court filings","legal opinions","deed of assignment","memoranda of understanding","shareholders agreement","board minutes","CAC filings","NDPR compliance"],
    certifications: ["BL","LLB","LLM","NBA membership","ICSAN","NBI","SAN","notary public"]
  },

  communications: {
    name: "Communications, PR & Media",
    titles: ["communications officer","public relations officer","PR manager","media relations officer","content writer","copywriter","journalist","editor","corporate communications officer","PR executive","media officer","editorial officer","communications manager","content strategist"],
    critical: ["press release writing","media relations","content strategy","corporate communications","crisis communications","stakeholder communication","brand messaging","editorial management","copywriting"],
    technical: ["media monitoring","PR software","cision","meltwater","brand24","SEO writing","AP style","chicago style","social media management","wordpress","CMS","canva","newsletter management","speech writing","annual report writing","media briefing","thought leadership content","NUJ membership"],
    certifications: ["NUJ membership","NIPR","PRCAN","NIMR","IIPR","corporate communications certification"]
  },

  journalism: {
    name: "Journalism & Broadcasting",
    titles: ["journalist","reporter","news anchor","broadcaster","editor","sub-editor","correspondent","photojournalist","video journalist","radio presenter","TV presenter","news producer","content producer"],
    critical: ["news writing","investigative reporting","fact-checking","news gathering","source verification","deadline adherence","editorial standards","broadcast presenting","news production"],
    technical: ["Adobe Premiere Pro","Final Cut Pro","DaVinci Resolve","audio editing","Adobe Audition","camera operation","live reporting","ENPS","iNews","AP wire","Reuters","news ethics","court reporting","beat reporting","data journalism","multimedia journalism","podcast production"],
    certifications: ["NUJ card","NPAN membership","BBC media training","journalism degree","broadcasting certificate"]
  },

  real_estate: {
    name: "Real Estate & Property",
    titles: ["estate agent","realtor","property manager","estate manager","facilities manager","letting agent","property officer","leasing officer","estate surveyor","valuation surveyor","property consultant","property sales officer","real estate manager","land officer"],
    critical: ["property valuation","lease management","rent collection","property marketing","client acquisition","property inspection","land title verification","facilities management","property documentation","sales negotiation"],
    technical: ["C of O processing","deed of assignment","survey plan","land use act","NIESV standards","property management software","property listing","MLS","due diligence","building inspection","site survey","GIS mapping","property database","title search","tenancy agreement","lease agreement","CAC property filings"],
    certifications: ["NIESV membership","RSV","ESV","RICS associate","property valuer licence","FNSE"]
  },

  architecture: {
    name: "Architecture & Urban Planning",
    titles: ["architect","urban planner","town planner","building designer","interior designer","landscape architect","architectural draftsman","architectural technician","planning officer","design officer"],
    critical: ["architectural design","building design","project documentation","technical drawings","site analysis","building code compliance","design presentation","construction supervision","client brief interpretation"],
    technical: ["AutoCAD","revit","ArchiCAD","SketchUp","3ds Max","lumion","rhino","BIM","3D rendering","architectural visualisation","NIA standards","building permit process","environmental impact assessment","planning permission","masterplanning","urban design","interior design","space planning","ARCON registration process"],
    certifications: ["ARCON registration","NIA membership","NITP membership","ARCON Part 3","NITP TOPAREP","RIBA"]
  },

  engineering: {
    name: "Engineering (General)",
    titles: ["graduate engineer","engineering officer","field engineer","plant engineer","maintenance engineer","production engineer","reliability engineer","process engineer","instrumentation engineer"],
    critical: ["engineering design","equipment maintenance","troubleshooting","technical documentation","project execution","quality control","HSE compliance","commissioning","site supervision"],
    technical: ["AutoCAD","solidworks","MATLAB","project management","maintenance planning","root cause analysis","preventive maintenance","corrective maintenance","condition monitoring","HAZOP","JSA","permit to work","SOP development","engineering drawings","P&ID","PFD"],
    certifications: ["COREN registration","NSE membership","graduate engineer status","professional engineer","engineering degree"]
  },

  civil_engineering: {
    name: "Civil & Structural Engineering",
    titles: ["civil engineer","structural engineer","site engineer","geotechnical engineer","construction engineer","quantity surveyor","land surveyor","highways engineer","resident engineer","construction manager"],
    critical: ["structural design","construction supervision","quantity surveying","bill of quantities","site management","material testing","foundation design","project quality assurance"],
    technical: ["STAAD Pro","SAP2000","ETABS","PLAXIS","AutoCAD civil 3D","revit structure","road design","drainage design","concrete design","reinforcement detailing","BOQ preparation","NEC contract","FIDIC contract","soil investigation","geotechnical report","subgrade analysis","pavement design"],
    certifications: ["COREN registration","NSE membership","NIQS membership","graduate engineer","MICE","CEng"]
  },

  electrical_engineering: {
    name: "Electrical & Power Engineering",
    titles: ["electrical engineer","power engineer","electrical technician","power systems engineer","electrical maintenance engineer","instrumentation engineer","control systems engineer","automation engineer","SCADA engineer","low voltage engineer"],
    critical: ["electrical installation","power systems analysis","maintenance planning","circuit design","switchgear operation","load analysis","protection relay coordination","energy audit"],
    technical: ["AutoCAD electrical","ETAP","PLC programming","SCADA","DCS","power factor correction","transformer maintenance","generator maintenance","UPS systems","earthing design","lightning protection","IEC standards","IEEE standards","NERC regulations","DISCO regulations","solar PV design","inverter installation","energy storage"],
    certifications: ["COREN registration","NSE electrical","NIESV electrical","licensed electrician","NABCEP solar","17th edition IET"]
  },

  mechanical_engineering: {
    name: "Mechanical Engineering",
    titles: ["mechanical engineer","mechanical technician","plant engineer","HVAC engineer","manufacturing engineer","rotating equipment engineer","piping engineer","thermal engineer"],
    critical: ["mechanical design","equipment maintenance","failure analysis","reliability engineering","pressure vessel inspection","rotating machinery management","piping system design","plant operations management"],
    technical: ["solidworks","AutoCAD","ANSYS","ASME codes","API standards","ISO standards","NDT methods","vibration analysis","thermodynamics","fluid mechanics","heat exchangers","pumps and compressors","turbines","HVAC design","cooling tower","refrigeration","welding inspection","CSWIP"],
    certifications: ["COREN registration","NSE mechanical","ASME certifications","CSWIP","PCN Level 2","NDT certification","plant inspector"]
  },

  oil_gas: {
    name: "Oil & Gas / Energy",
    titles: ["petroleum engineer","reservoir engineer","production engineer","drilling engineer","facilities engineer","process engineer","pipeline engineer","well engineer","subsurface engineer","petroleum geologist","petrophysicist","completion engineer","wellsite geologist"],
    critical: ["reservoir management","production optimisation","drilling operations","well integrity","process engineering","pipeline operations","subsurface analysis","hydrocarbon accounting","HSE management"],
    technical: ["petrel","eclipse","pipesim","prosper","HYSYS","AVEVA","OLGA","Schlumberger tools","Halliburton software","well log analysis","seismic interpretation","production chemistry","sand management","scale management","DPR regulations","NCDMB compliance","SPE standards","API RP standards","FPSO operations","offshore operations","onshore operations"],
    certifications: ["OPITO BOSIET","HUET","IWCF","SPE membership","PetroSkills","NUPENG","PENGASSAN","petroleum engineering degree"]
  },

  agriculture: {
    name: "Agriculture & Agribusiness",
    titles: ["agronomist","agricultural officer","farm manager","agricultural extension officer","agribusiness officer","crop scientist","animal scientist","farm supervisor","agro-processing officer","food scientist","agricultural engineer","horticulturalist","livestock officer","fisheries officer"],
    critical: ["crop production management","agronomy","soil analysis","pest and disease management","farm planning","irrigation management","harvest management","agricultural extension service","livestock management"],
    technical: ["soil testing","fertiliser application","precision agriculture","GIS for agriculture","crop monitoring","post-harvest handling","value chain analysis","agribusiness model","FMARD regulations","NAFDAC agricultural","SON standards","cooperative management","agricultural financing","commodity trading","cold chain agriculture","greenhouse management"],
    certifications: ["B.Agric","M.Sc agronomy","FMAN membership","NASC certification","NAFDAC registration","extension worker certification","animal science degree"]
  },

  hospitality: {
    name: "Hospitality, Tourism & Hotels",
    titles: ["hotel manager","front office officer","hotel receptionist","guest service officer","food and beverage manager","restaurant manager","housekeeping supervisor","concierge","banquet manager","resort manager","tourism officer","tour guide","reservations officer","hotel supervisor"],
    critical: ["guest satisfaction management","hotel operations","reservations management","front desk operations","housekeeping management","food and beverage operations","revenue management","complaint resolution guest"],
    technical: ["opera PMS","micros POS","FIDELIO","channel manager","OTA management","booking.com","expedia","airbnb","room occupancy management","yield management","food hygiene HACCP","NAFDAC compliance","banqueting operations","events coordination hotel","daily room checks","hotel reporting"],
    certifications: ["NTHC certification","hospitality management degree","food hygiene certificate","sommelier certificate","IATA travel agent"]
  },

  catering: {
    name: "Catering, Food & Beverage",
    titles: ["chef","head chef","sous chef","pastry chef","kitchen manager","catering officer","catering manager","food production officer","bartender","waiter","restaurant supervisor","canteen officer"],
    critical: ["food preparation","menu planning","food safety","kitchen management","portion control","food quality control","food costing","kitchen equipment operation","HACCP compliance"],
    technical: ["NAFDAC regulations","food hygiene certificate","recipe development","catering for events","bulk cooking","food storage standards","temperature control","allergen management","beverage management","bar management","table service","event catering","cook-chill","cook-freeze"],
    certifications: ["food hygiene certificate","NAFDAC food handler","culinary arts degree","Cordon Bleu","NVQ food production","WSET wine"]
  },

  manufacturing: {
    name: "Manufacturing & Production",
    titles: ["production manager","production officer","manufacturing engineer","factory manager","plant manager","operations manager","production supervisor","shift supervisor","assembly officer","production technician"],
    critical: ["production planning","line management","output monitoring","quality control","OEE management","downtime reduction","material requirements planning","shift management","production reporting"],
    technical: ["lean manufacturing","5S methodology","six sigma","kaizen","ISO 9001","production scheduling","BOM management","work order management","ERP manufacturing","SAP production","capacity planning","throughput analysis","cycle time analysis","SPC","SMED","value stream mapping","poka-yoke","kanban system"],
    certifications: ["six sigma green belt","six sigma black belt","lean manufacturing certification","ISO 9001 internal auditor","APICS certification"]
  },

  quality_assurance: {
    name: "Quality Assurance & Quality Control",
    titles: ["QA officer","quality assurance officer","quality control officer","QC officer","quality manager","quality engineer","QA/QC inspector","product inspector","quality analyst","QHSE officer","quality auditor"],
    critical: ["quality inspection","non-conformance management","corrective action","root cause analysis","quality audit","SOP development","specification compliance","sampling inspection","product testing"],
    technical: ["ISO 9001","ISO 22000","HACCP","GMP","GDP","NAFDAC compliance","SON standards","quality manual","CAPA process","FMEA","SPC","statistical sampling","AQL sampling","calibration management","laboratory testing","inspection checklist","quality reporting","batch records"],
    certifications: ["ISO 9001 lead auditor","ISO 22000 auditor","CQPA","CQE","NAFDAC inspector","SON certification","six sigma green belt","ASQ certification"]
  },

  procurement: {
    name: "Procurement & Purchasing",
    titles: ["procurement officer","purchasing officer","buyer","procurement manager","sourcing officer","procurement executive","supply officer","purchasing manager","procurement specialist","category manager","materials officer"],
    critical: ["supplier sourcing","vendor evaluation","purchase order management","contract management","cost reduction","bid evaluation","tender management","spend management","supplier relationship management"],
    technical: ["SAP MM","oracle procurement","ariba","e-procurement","RFQ management","RFP management","supplier audit","incoterms","HS codes","import documentation","customs clearance","supplier development","category management","TCO analysis","spend analysis","approved vendor list management","CIPS framework"],
    certifications: ["CIPS level 4","CIPS level 5","CIPS level 6","MCIPS","FCIPS","procurement certification","supply chain management professional"]
  },

  retail: {
    name: "Retail & Store Operations",
    titles: ["store manager","retail manager","shop assistant","sales associate","store officer","retail officer","floor manager","retail supervisor","branch manager","showroom manager","store supervisor","merchandise officer"],
    critical: ["sales floor management","stock replenishment","inventory control","daily sales reporting","visual merchandising","cash handling","shrinkage control","target achievement","customer service retail"],
    technical: ["POS system","stock taking","planogram implementation","loss prevention","FIFO stock rotation","daily reconciliation","retail ERP","retail analytics","footfall tracking","conversion rate tracking","loyalty programme management","retail KPIs","end of day procedures","product knowledge","returns management"],
    certifications: []
  },

  hse: {
    name: "Health, Safety & Environment (HSE)",
    titles: ["HSE officer","safety officer","health and safety officer","environment officer","HSE manager","EHS officer","safety engineer","occupational health officer","HSE coordinator","safety inspector","QHSE officer","safety supervisor"],
    critical: ["risk assessment","incident investigation","hazard identification","permit to work","safety inspection","emergency response planning","safety training delivery","accident reporting","environmental compliance"],
    technical: ["HAZOP","JSA","job safety analysis","COSHH assessment","fire risk assessment","behavioural based safety","LOTO","HIRA","incident command system","ISO 14001","ISO 45001","OHSAS 18001","environmental impact assessment","EIA","waste management","oil spill response","DPR safety regulations","OSHA standards","safety statistics","LTI tracking","LTIR"],
    certifications: ["NEBOSH IGC","NEBOSH diploma","IOSH managing safely","ISPON membership","CMIOSH","OHST","CHST","DPR safety certificate","BOSIET","OPITO"]
  },

  ngo: {
    name: "NGO, Social Work & Development",
    titles: ["program officer","development officer","community development officer","field officer","monitoring and evaluation officer","M&E officer","humanitarian officer","project officer","community liaison officer","gender officer","protection officer","program coordinator","livelihoods officer","nutrition officer"],
    critical: ["programme implementation","monitoring and evaluation","data collection","community mobilisation","stakeholder engagement","donor reporting","capacity building","beneficiary management","field operations"],
    technical: ["log frame","theory of change","results framework","KOBO toolbox","ODK","DHIS2","donor reporting USAID","PEPFAR reporting","GBV case management","protection mainstreaming","WASH programming","food security assessment","livelihood programming","IEC material development","FGD facilitation","KII","MEAL system","indicator tracking","grant management"],
    certifications: ["MPH","MSc development","PMD Pro","CPS","humanitarian leadership academy","SPHERE standards training","ECB certification"]
  },

  graphic_design: {
    name: "Graphic Design & Creative Arts",
    titles: ["graphic designer","visual designer","art director","creative director","illustrator","motion graphics designer","brand designer","print designer","digital designer","creative officer","multimedia designer"],
    critical: ["visual design","brand identity design","typography","layout design","artwork production","design for print","digital design","logo design","packaging design"],
    technical: ["Adobe Photoshop","Adobe Illustrator","Adobe InDesign","Adobe After Effects","canva pro","CorelDraw","Figma","procreate","motion graphics","3D design","3ds Max","blender","print production","colour management","brand guidelines","mock-up creation","social media design","infographic design","editorial design","UI visual design"],
    certifications: ["adobe certified professional","graphic design degree","HND graphic design","creative arts certification"]
  },

  ui_ux: {
    name: "UX/UI & Product Design",
    titles: ["UX designer","UI designer","product designer","interaction designer","UX researcher","UX/UI designer","digital product designer","experience designer","app designer","web designer"],
    critical: ["user experience design","wireframing","prototyping","user research","usability testing","information architecture","design system development","user journey mapping","interface design"],
    technical: ["Figma","sketch","Adobe XD","InVision","zeplin","principle","framer","maze","usertesting","hotjar","A/B testing","accessibility design","WCAG","responsive design","design tokens","component library","atomic design","user personas","card sorting","heuristic evaluation","user testing scripts"],
    certifications: ["Google UX design certificate","interaction design foundation","NN/g UX certification","product design bootcamp"]
  },

  photography: {
    name: "Photography, Videography & Film",
    titles: ["photographer","videographer","cinematographer","video editor","photo editor","content creator visual","studio photographer","wedding photographer","documentary filmmaker","video producer","broadcast engineer"],
    critical: ["photography","videography","video editing","colour grading","lighting setup","composition","post-production","content delivery","client brief execution"],
    technical: ["Adobe Premiere Pro","Final Cut Pro","DaVinci Resolve","Adobe Lightroom","Adobe Photoshop","Adobe After Effects","camera operation","drone operation","sound recording","audio mixing","youtube production","social media content","live streaming","green screen","motion graphics"],
    certifications: ["CAA drone licence","DIT certification","Sony certified","canon certification","NUJ photography membership"]
  },

  events: {
    name: "Event Management & Planning",
    titles: ["event manager","event planner","event coordinator","events officer","wedding planner","conference organiser","exhibitions officer","event executive","venue coordinator","event producer"],
    critical: ["event planning","event execution","vendor coordination","budget management","client management","event logistics","venue coordination","event marketing","post-event evaluation"],
    technical: ["event management software","eventbrite","cvent","event budgeting","AV management","event production","MC coordination","event decor coordination","catering management","guest management","event registration","event ticketing","sponsorship management","event analytics","virtual event platforms","Zoom events","Teams live"],
    certifications: ["CSEP","CMP","DES","event management degree","MICE certification","PCO certification"]
  },

  telecoms: {
    name: "Telecommunications",
    titles: ["telecoms engineer","RF engineer","network engineer telecoms","telecom officer","telecoms technician","field service engineer","base station engineer","transmission engineer","switch engineer","fibre engineer"],
    critical: ["RF planning","network optimisation","base station maintenance","transmission network management","network troubleshooting","field operations management","capacity planning telecoms"],
    technical: ["Huawei equipment","Ericsson equipment","Nokia equipment","4G LTE","5G NR","MIMO","antenna installation","BTS commissioning","microwave links","fibre optic splicing","OTDR testing","OSS/BSS","drive testing","TEMS","mapinfo","spectrum analysis","VSWR testing","site acceptance testing","NCC regulations","MTN network","Airtel network"],
    certifications: ["CCNA","CCNP","Huawei HCIA","Ericsson certified","Nokia certified","NCC type approval","telecommunications engineering degree"]
  },

  aviation: {
    name: "Aviation & Aerospace",
    titles: ["pilot","commercial pilot","air traffic controller","aircraft maintenance engineer","AME","flight attendant","cabin crew","airport operations officer","aviation safety officer","ground handling officer","cargo officer aviation","airline operations officer"],
    critical: ["flight operations","aircraft maintenance","airspace management","safety management system","crew resource management","emergency procedures","aviation regulatory compliance","ground handling operations"],
    technical: ["NCAA regulations","ICAO procedures","IATA standards","aircraft troubleshooting","avionics","aeronautical charts","weather interpretation","NOTAM","ATIS","flight dispatch","load and balance","dangerous goods handling","security screening","FIDS","AIMS","SITA systems"],
    certifications: ["ATPL","CPL","PPL","instrument rating","EASA licence","NCAA licence","IATA DGR","airside driving permit","AME licence","AVSEC certification"]
  },

  maritime: {
    name: "Maritime & Shipping",
    titles: ["marine officer","ship captain","maritime engineer","port officer","shipping officer","clearing agent","freight forwarder","maritime operations officer","deck officer","ship engineer","port operations officer","stevedoring officer"],
    critical: ["vessel operations","port operations","cargo management","freight forwarding","customs clearance","shipping documentation","import export procedures","maritime safety"],
    technical: ["NIMASA regulations","NPA operations","bill of lading","customs entry","HS codes","incoterms","SWIFT messaging","dangerous goods","IMDG code","container management","MARPOL compliance","SOLAS regulations","ISM code","vessel tracking","AIS","ship agency operations","demurrage calculation","charter party"],
    certifications: ["STCW","GMDSS","OOW certificate","chief mate certificate","masters certificate","NIMASA seafarer","marine engineering certificate","NPA clearance agent"]
  },

  environment: {
    name: "Environmental Services & Sustainability",
    titles: ["environmental officer","sustainability officer","environmental consultant","EIA officer","waste management officer","environmental scientist","environmental compliance officer","ESG officer","environmental health officer"],
    critical: ["environmental impact assessment","environmental monitoring","regulatory compliance","waste management","pollution control","environmental audit","sustainability reporting","ESG reporting"],
    technical: ["NESREA regulations","DPR environmental","EPA standards","EIA guidelines","ISO 14001","waste classification","effluent testing","air quality monitoring","water quality analysis","carbon footprint calculation","GHG inventory","environmental data analysis","GIS environmental","ESIA","environmental management plan","CSR reporting","ESG metrics","TCFD reporting"],
    certifications: ["IEMA associate","IEMA practitioner","NEBOSH environmental","ISO 14001 lead auditor","environmental science degree","NELA membership","FEPA registration"]
  },

  credit: {
    name: "Credit Management & Debt Recovery",
    titles: ["credit officer","debt recovery officer","credit analyst","collections officer","loan recovery officer","credit controller","debt collection officer","recovery officer","credit risk officer","collections manager","credit manager"],
    critical: ["credit assessment","loan recovery","collections strategy","credit risk analysis","portfolio quality management","overdue account management","credit bureau analysis","payment plan negotiation","debt recovery process"],
    technical: ["CRC credit bureau","FirstCentral","XDS","credit scoring model","PAR calculation","non-performing loan management","legal recovery process","repossession process","court garnishment","sheriff execution","field collections","skip tracing","aging report analysis","provisioning calculation","write-off process","IFRS 9 provisioning","credit policy application"],
    certifications: ["CICM","credit management certificate","MACM","FCA","law background beneficial"]
  },

  consulting: {
    name: "Consulting & Management Consulting",
    titles: ["management consultant","business consultant","strategy consultant","business analyst consultant","advisory officer","operations consultant","transformation officer","change management consultant","organisational development consultant","IT consultant","financial consultant"],
    critical: ["business analysis","strategy development","client relationship management","problem-solving methodology","project delivery","stakeholder management","insights and recommendations","process improvement","change management"],
    technical: ["PowerPoint presentation","financial modelling","excel advanced","process mapping","data analysis","benchmarking","business case development","market entry strategy","feasibility study","due diligence","operating model design","organisational design","cost optimisation","digital transformation","agile transformation","programme management"],
    certifications: ["MBA","PRINCE2","PMP","lean six sigma","change management certification","McKinsey training","KPMG methodology","consulting firm alumni"]
  },

  insurance_sales: {
    name: "Insurance Sales & Financial Advisory",
    titles: ["insurance sales agent","financial advisor","life insurance agent","insurance broker","investment advisor","wealth manager","financial planner","bancassurance sales officer"],
    critical: ["insurance sales","financial needs analysis","policy sales","client acquisition","premium collection","renewal management","financial planning","investment advisory","client portfolio management"],
    technical: ["life insurance products","annuities","unit-linked plans","endowment policy","term assurance","health insurance products","investment linked products","pension advisory","mutual funds","NAICOM regulations","actuarial tables","illustration software","financial planning software","retirement planning","estate planning","tax planning insurance"],
    certifications: ["CIIN","CII certificate","LOMA fellowship","CFP","ChFC","NAIP certification","NIA associate"]
  },

  lab_science: {
    name: "Laboratory Science (General)",
    titles: ["laboratory scientist","lab officer","laboratory technician","research scientist","scientific officer","chemical analyst","quality control analyst","lab analyst","materials scientist","food testing officer","pharmaceutical lab officer"],
    critical: ["analytical testing","sample preparation","instrument operation","quality control laboratory","results documentation","laboratory safety","SOP compliance","calibration management","data recording"],
    technical: ["HPLC","GC-MS","AAS","FTIR","UV-Vis spectrophotometry","PCR","ELISA","microbiology techniques","chemistry techniques","ISO 17025","LIMS","LIS","reagent management","reference standards","method validation","OOS investigation","stability testing","proficiency testing","glassware calibration"],
    certifications: ["MLSCN registration","BMLS","FICS","ISO 17025 internal auditor","chemistry degree","biochemistry degree","NAFDAC registration"]
  },

  writing: {
    name: "Writing, Editing & Publishing",
    titles: ["content writer","copywriter","editor","technical writer","proofreader","ghostwriter","academic writer","proposal writer","content strategist","report writer"],
    critical: ["copywriting","content writing","editing","proofreading","content strategy","SEO writing","research and writing","deadline management","style guide adherence"],
    technical: ["SEO optimisation","keyword research","wordpress","CMS management","google docs","microsoft word","plagiarism detection","readability tools","grammarly","AP style","chicago style","APA referencing","harvard referencing","content management","email copywriting","landing page copy","social media copy","technical documentation","report writing","proposal writing"],
    certifications: ["journalism degree","communications degree","HubSpot content certification","SEMrush content certification","NUJ membership","CIPR membership"]
  },

  training: {
    name: "Training, Learning & Development",
    titles: ["training officer","L&D officer","learning and development officer","training coordinator","training manager","facilitator","corporate trainer","instructional designer","e-learning developer","capacity building officer"],
    critical: ["training needs analysis","curriculum design","training delivery","facilitation","instructional design","learning evaluation","e-learning development","training assessment","capacity building"],
    technical: ["articulate storyline","articulate rise","adobe captivate","moodle","LMS administration","SCORM","xAPI","kirkpatrick model","adult learning principles","blended learning design","virtual training delivery","zoom training","microsoft teams training","training ROI measurement","competency framework design","training calendar management","on-the-job training design"],
    certifications: ["CIPD level 3 L&D","CIPD level 5 L&D","CPLP","ATD membership","CIPM L&D","training qualification","instructional design certificate","HACR certification"]
  },

  power_energy: {
    name: "Power & Energy",
    titles: ["power engineer","energy officer","renewable energy officer","solar engineer","solar technician","energy auditor","power systems engineer","metering officer","distribution engineer","energy consultant","TCN engineer","DISCO officer"],
    critical: ["power system operation","distribution network management","energy metering","outage management","load shedding management","energy audit","renewable energy installation","grid connection"],
    technical: ["NERC regulations","AEDC","EEDC","IKEDC","BEDC","solar PV design","inverter installation","battery storage","mini-grid design","off-grid systems","SCADA power","distribution automation","transformer maintenance","feeder management","revenue protection","smart metering","AMI","AMR","net metering","power quality analysis","energy certificate"],
    certifications: ["COREN registration","NERC metering certification","NABCEP solar PV","energy auditor certification","electrical installation certificate","NSE electrical"]
  },

  fashion: {
    name: "Fashion, Textile & Clothing",
    titles: ["fashion designer","fashion stylist","clothing manufacturer","textile officer","pattern maker","tailor","seamstress","fashion buyer","fashion marketing officer","fashion brand manager"],
    critical: ["fashion design","pattern making","garment construction","fashion sketching","fabric sourcing","collection development","brand development fashion","fashion production management"],
    technical: ["Adobe Illustrator fashion","CLO3D","pattern grading","technical pack","tech pack","BOM fashion","sample development","production follow-up","import export fashion","NAFDAC fashion compliance","trend forecasting","lookbook creation","fashion photography direction","retail buying","merchandise planning","OTB planning"],
    certifications: ["fashion design degree","HND fashion","Parsons","LCF","LASMODE","fashion merchandising certificate"]
  },

  sports: {
    name: "Sports, Fitness & Recreation",
    titles: ["sports officer","fitness instructor","gym instructor","sports coach","personal trainer","sports manager","recreation officer","physical education teacher","wellness officer"],
    critical: ["exercise programming","fitness assessment","client coaching","strength and conditioning","group fitness instruction","sports event management","athlete development","physical training"],
    technical: ["exercise physiology","nutrition planning","sports injury prevention","programme periodisation","VO2 max testing","functional movement screening","FMS","heart rate monitoring","GPS tracking athletes","video analysis","sports analytics","plyometric training","Olympic lifting","resistance training","HIIT programming","yoga instruction","pilates instruction"],
    certifications: ["NSCA CSCS","ACE","NASM CPT","ACSM","REPs accredited","ISSA","UK Athletics coaching","CAC coaching","sports science degree","first aid AED"]
  },

  beauty: {
    name: "Beauty, Salon & Personal Care",
    titles: ["hairstylist","makeup artist","beautician","cosmetologist","nail technician","esthetician","beauty therapist","salon manager","barber","beauty consultant","beauty educator"],
    critical: ["hairstyling","makeup application","skincare treatment","client consultation","salon management","product knowledge beauty","hygiene standards","beauty treatment delivery"],
    technical: ["hair colouring techniques","keratin treatment","hair extensions","balayage","ombre","microblading","lash extensions","eyebrow lamination","facials","chemical peels","microdermabrasion","waxing","manicure pedicure","nail art","airbrush makeup","bridal makeup","beauty retail","salon booking software","salon POS","product retail upselling"],
    certifications: ["cosmetology licence","beauty therapy NVQ","VTCT certificate","CIDESCO","CIBTAC","ITEC","Dermalogica authorised","barbering licence","nail tech certification"]
  },

  digital_content: {
    name: "Digital Content & Online Presence",
    titles: ["digital content creator","online content officer","YouTube creator","podcast producer","digital media officer","content strategist digital","video content creator","influencer","brand ambassador digital"],
    critical: ["content creation","content strategy","audience growth","platform management","video production","content scheduling","engagement management","content analytics","monetisation strategy"],
    technical: ["YouTube SEO","instagram algorithm","tiktok content","podcast production","Anchor FM","spotify for podcasters","video editing","CapCut","DaVinci Resolve","canva","adobe premiere","Adsense","affiliate marketing","brand partnerships","content calendar","cross-platform distribution","subscriber growth","watch time optimisation","audience retention","email list building"],
    certifications: ["YouTube certification","HubSpot content","social media marketing certification","digital marketing degree","creator academy"]
  },

  bank_ops: {
    name: "Banking Operations & Back Office",
    titles: ["banking operations officer","back office officer","settlement officer","reconciliation officer","payment officer","operations analyst","SWIFT officer","clearing officer","trade operations officer","transaction processing officer"],
    critical: ["transaction processing","settlement management","payment reconciliation","error resolution","operational compliance","end of day processing","trade operations","account balancing"],
    technical: ["SWIFT messaging","RTGS","NIP","NIBSS NIP","NEFT","interbank settlement","nostro reconciliation","vostro reconciliation","trade finance documentation","letter of credit processing","bank guarantee issuance","forex processing","core banking system","temenos T24","finacle","flexcube","opera banking","risk-based authentication","cut-off time management"],
    certifications: ["ACIB","banking operations certificate","CIBN","trade finance certification","SWIFT certification","treasury operations certification"]
  },

  health_admin: {
    name: "Health Administration & Medical Records",
    titles: ["health administrator","hospital administrator","medical records officer","health information officer","patient registration officer","clinical administrator","health facility manager","ward administrator","billing officer hospital","health records officer"],
    critical: ["medical records management","patient registration","appointment scheduling","health facility administration","clinical documentation","patient data management","health insurance billing","patient flow management"],
    technical: ["EMR system","EHR implementation","NHIS billing","health insurance claims","ICD-10 coding","CPT coding","health management information system","hospital management software","bed management","admission discharge transfer","health statistics reporting","HIPAA compliance","NDPR compliance","clinical coding","DRG"],
    certifications: ["HIMSS","RHIA","RHIT","health information management degree","hospital administration degree","AHIMA membership"]
  },

  estate_dev: {
    name: "Property Development & Construction",
    titles: ["property developer","construction project manager","site manager","building contractor","construction supervisor","quantity surveyor","construction estimator","real estate developer","housing developer","project director construction"],
    critical: ["project planning construction","site management","quantity surveying","cost estimation","contractor management","construction programme","quality management construction","HSE on site","project handover"],
    technical: ["primavera P6","MS project","AutoCAD","revit","NEC contract","JCT contract","FIDIC contract","BOQ preparation","materials procurement","building permit process","environmental impact","CAC property registration","building approval LASPPPA","FCDA approval","BVAC"],
    certifications: ["NIQS membership","CORBON registration","NIA registration","COREN civil","quantity surveying degree","project management professional"]
  }

};

/* ============================================================
   ROLE DETECTION — matches JD text against role title bank
   ============================================================ */

function detectRole(jdText) {
  const jdLower = jdText.toLowerCase();
  let bestMatch = null;
  let bestScore  = 0;

  for (const [roleId, role] of Object.entries(ROLE_DATABASE)) {
    // Title match (strongest signal)
    const titleScore = role.titles.reduce((n, t) => n + (jdLower.includes(t) ? 3 : 0), 0);
    // Critical keyword presence (secondary signal)
    const kwScore = role.critical.reduce((n, k) => n + (jdLower.includes(k.toLowerCase()) ? 0.5 : 0), 0);
    const total = titleScore + kwScore;
    if (total > bestScore) { bestScore = total; bestMatch = roleId; }
  }

  return bestScore >= 3 ? { roleId: bestMatch, confidence: bestScore } : null;
}

/* ---- Detect role from explicit job title input (more accurate than JD scan) ---- */
function detectRoleFromTitle(jobTitle) {
  if (!jobTitle || jobTitle.trim().length < 2) return null;
  const input = jobTitle.toLowerCase().trim();
  let bestMatch = null;
  let bestScore  = 0;

  for (const [roleId, role] of Object.entries(ROLE_DATABASE)) {
    let score = 0;
    for (const t of role.titles) {
      if (input === t)             { score += 10; break; }  // exact match
      if (input.includes(t))       { score += 6; }          // input contains role title
      if (t.includes(input))       { score += 5; }          // role title contains input
      // word-level overlap
      const iWords = input.split(/\s+/).filter(w => w.length > 3);
      const tWords = t.split(/\s+/).filter(w => w.length > 3);
      const overlap = iWords.filter(w => tWords.includes(w)).length;
      score += overlap * 2;
    }
    if (score > bestScore) { bestScore = score; bestMatch = roleId; }
  }

  return bestScore >= 5 ? { roleId: bestMatch, confidence: bestScore } : null;
}
