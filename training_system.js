/**
 * ICF-SL Training & Competency System
 * Training videos, 100% pass assessments, certificates, max 3 attempts
 */

// ════════════════════════════════════════════════════
// TRAINING STATE & CONFIG
// ════════════════════════════════════════════════════

const TRAINING_CONFIG = {
    passScore: 100,
    maxAttempts: 3,
    questionsPerQuiz: 10,
    timeoutSeconds: 3600 // 1 hour session
};

class TrainingSystem {
    constructor() {
        this.currentModule = null;
        this.currentAttempt = 0;
        this.attemptAnswers = [];
        this.completedModules = new Set();
        this.certsGenerated = new Map();
        this.loadState();
    }

    loadState() {
        try {
            const saved = localStorage.getItem('icf_training_state');
            if (saved) {
                const state = JSON.parse(saved);
                this.completedModules = new Set(state.completedModules || []);
                this.certsGenerated = new Map(state.certsGenerated || []);
            }
        } catch (e) {
            console.warn('Training state load failed:', e);
        }
    }

    saveState() {
        try {
            localStorage.setItem('icf_training_state', JSON.stringify({
                completedModules: [...this.completedModules],
                certsGenerated: [...this.certsGenerated.entries()]
            }));
        } catch (e) {
            console.warn('Training state save failed:', e);
        }
    }

    // Check if module is fully trained & certified
    isModuleCompleted(moduleId) {
        return this.completedModules.has(moduleId);
    }

    // Get remaining attempts for a module
    getRemainingAttempts(moduleId) {
        const key = `attempts_${moduleId}`;
        const attempted = parseInt(localStorage.getItem(key) || '0', 10);
        return Math.max(0, TRAINING_CONFIG.maxAttempts - attempted);
    }

    // Increment attempt counter
    recordAttempt(moduleId) {
        const key = `attempts_${moduleId}`;
        const current = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, current + 1);
    }

    // Mark module as completed
    markCompleted(moduleId, userName) {
        this.completedModules.add(moduleId);
        this.certsGenerated.set(moduleId, {
            userName,
            timestamp: new Date().toISOString(),
            score: 100
        });
        this.saveState();
    }
}

const trainingSystem = new TrainingSystem();

// ════════════════════════════════════════════════════
// QUESTION BANKS — 10+ questions per module
// ════════════════════════════════════════════════════

const QUESTION_BANKS = {
    dataentry: [
        {
            id: 1,
            question: 'What is the primary purpose of the School-Based ITN Distribution Survey?',
            options: [
                'To track ITN distribution and school enrollment data in real-time',
                'To monitor teacher attendance only',
                'To record school fees',
                'To assess teacher performance'
            ],
            correct: 0
        },
        {
            id: 2,
            question: 'How many classes are covered in the enrollment and ITN distribution section?',
            options: ['Class 1-3', 'Class 1-5', 'Class 1-6', 'Class 2-6'],
            correct: 1
        },
        {
            id: 3,
            question: 'What validation rule applies to ITN distribution?',
            options: [
                'ITNs distributed can exceed enrollment',
                'ITNs distributed cannot exceed the number enrolled',
                'All ITNs must be distributed regardless of enrollment',
                'There is no validation'
            ],
            correct: 1
        },
        {
            id: 4,
            question: 'What information is collected for each class?',
            options: [
                'Only total enrollment',
                'Boys and girls enrollment plus ITN distribution separately',
                'Teacher names only',
                'School fees by class'
            ],
            correct: 1
        },
        {
            id: 5,
            question: 'Which ITN type is used in this programme?',
            options: ['PBO ITN', 'IG2 ITN', 'Dual-AI Net', 'Mixed nets'],
            correct: 2
        },
        {
            id: 6,
            question: 'What does the summary dashboard automatically calculate?',
            options: [
                'Teacher salaries',
                'Total enrollment, ITN distribution, coverage rates, and proportions',
                'School fees only',
                'Nothing — manual calculation required'
            ],
            correct: 1
        },
        {
            id: 7,
            question: 'How is school identification done in the survey?',
            options: [
                'By teacher name only',
                'By QR code scan or manual cascading selection (District → Chiefdom → PHU → School)',
                'By random selection',
                'By phone number'
            ],
            correct: 1
        },
        {
            id: 8,
            question: 'What are signature requirements in Section F?',
            options: [
                'Head teacher signature only',
                'Health staff and teacher signatures required',
                'No signatures needed',
                'GPS location only'
            ],
            correct: 1
        },
        {
            id: 9,
            question: 'How many attempts are allowed for the competency assessment?',
            options: ['Unlimited', '2 attempts', '3 attempts', '1 attempt only'],
            correct: 2
        },
        {
            id: 10,
            question: 'What is the passing score for competency assessments?',
            options: ['70%', '80%', '90%', '100%'],
            correct: 3
        }
    ],

    monitoring: [
        {
            id: 1,
            question: 'What is the primary function of the Monitoring module?',
            options: [
                'To track ITN distribution progress and data quality',
                'To manage school enrollment',
                'To pay staff salaries',
                'To track teacher absenteeism'
            ],
            correct: 0
        },
        {
            id: 2,
            question: 'Who uses the Monitoring module?',
            options: [
                'Only distributors',
                'National monitors and supervisors',
                'Only teachers',
                'Community leaders'
            ],
            correct: 1
        },
        {
            id: 3,
            question: 'What data quality checks are important in monitoring?',
            options: [
                'Only enrollment numbers',
                'Data coherency, outlier detection, facility reporting rates',
                'Only ITN quantities',
                'Teacher names'
            ],
            correct: 1
        },
        {
            id: 4,
            question: 'How frequently should monitoring visits occur?',
            options: [
                'Once at end of campaign',
                'Weekly or as needed based on risk indicators',
                'Once per month fixed',
                'Never — data-based only'
            ],
            correct: 1
        },
        {
            id: 5,
            question: 'What is a key indicator of poor data quality?',
            options: [
                'High enrollment numbers',
                'Schools with zero ITN distribution when target is high',
                'Many teachers',
                'Good weather'
            ],
            correct: 1
        },
        {
            id: 6,
            question: 'What action should be taken if a school has missing data?',
            options: [
                'Ignore it',
                'Follow up with the school to complete submission',
                'Delete the record',
                'Report only partial data'
            ],
            correct: 1
        },
        {
            id: 7,
            question: 'How are monitoring findings documented?',
            options: [
                'Verbally only',
                'In a monitoring report with observations and corrective actions',
                'Not documented',
                'Only in phone calls'
            ],
            correct: 1
        },
        {
            id: 8,
            question: 'What role does GPS location play in monitoring?',
            options: [
                'No role',
                'Verifies school location and helps with site targeting',
                'Used only for routing',
                'For billing purposes'
            ],
            correct: 1
        },
        {
            id: 9,
            question: 'How should discrepancies between expected and reported ITN be handled?',
            options: [
                'Ignore them',
                'Investigate and request clarification from the school',
                'Automatically delete data',
                'Report without investigating'
            ],
            correct: 1
        },
        {
            id: 10,
            question: 'What is the ultimate goal of monitoring activities?',
            options: [
                'To punish underperformance',
                'To ensure data accuracy and support continuous improvement',
                'To close schools',
                'To reduce staff'
            ],
            correct: 1
        }
    ],

    movement: [
        {
            id: 1,
            question: 'What does the ITN Movement module track?',
            options: [
                'Teacher movements',
                'Physical movement of ITNs from dispatch to schools',
                'Student attendance',
                'Vehicle fuel consumption'
            ],
            correct: 1
        },
        {
            id: 2,
            question: 'Who is responsible for recording ITN movement?',
            options: [
                'Only head teachers',
                'Conveyors/logistics staff dispatching ITNs',
                'Monitors only',
                'Health workers'
            ],
            correct: 1
        },
        {
            id: 3,
            question: 'What key information is captured in ITN movement tracking?',
            options: [
                'Only quantities',
                'Dispatch date, quantity, destination school, receiver, confirmation',
                'Only school names',
                'Only driver names'
            ],
            correct: 1
        },
        {
            id: 4,
            question: 'How does QR code tracking help with ITN movement?',
            options: [
                'It does not help',
                'Enables quick scan-to-record dispatch and delivery confirmation',
                'Used for teacher identification',
                'For printing only'
            ],
            correct: 1
        },
        {
            id: 5,
            question: 'What happens if ITNs are lost during movement?',
            options: [
                'No record needed',
                'Report as undelivered and investigate with conveyor',
                'Assume they arrived',
                'Ignore the loss'
            ],
            correct: 1
        },
        {
            id: 6,
            question: 'How many attempts for ITN delivery are allowed?',
            options: [
                '1 attempt only',
                'Unlimited',
                'Up to 3 delivery attempts before escalating',
                'Decided per school'
            ],
            correct: 2
        },
        {
            id: 7,
            question: 'What triggers an ITN movement record?',
            options: [
                'Teacher requests',
                'Formal dispatch authorization with designated school destination',
                'Random selection',
                'Student votes'
            ],
            correct: 1
        },
        {
            id: 8,
            question: 'How is convoy/logistics team accountability ensured?',
            options: [
                'Verbal promises',
                'Digital signatures and GPS tracking of movements',
                'Paper forms',
                'Not ensured'
            ],
            correct: 1
        },
        {
            id: 9,
            question: 'What should be done if a school reports ITNs not received?',
            options: [
                'Assume they are lying',
                'Cross-check movement records and investigate the gap',
                'Send replacement without verification',
                'Close the case'
            ],
            correct: 1
        },
        {
            id: 10,
            question: 'What is the benefit of real-time ITN movement tracking?',
            options: [
                'No benefit',
                'Immediate visibility of stock location, accountability, and timely issue resolution',
                'Slows down operations',
                'Increases cost'
            ],
            correct: 1
        }
    ],

    itnreceived: [
        {
            id: 1,
            question: 'What is the purpose of the ITN Received module?',
            options: [
                'To track teacher payments',
                'To record when schools receive ITNs and confirm quantities',
                'To count school enrollment',
                'To track teacher attendance'
            ],
            correct: 1
        },
        {
            id: 2,
            question: 'Who is the primary user of the ITN Received module?',
            options: [
                'Distributors',
                'PHU staff receiving ITN deliveries',
                'National monitors',
                'School teachers only'
            ],
            correct: 1
        },
        {
            id: 3,
            question: 'What information must be recorded when ITNs are received?',
            options: [
                'Only ITN quantity',
                'Quantity received, date, receiver name, delivery voucher number, condition check',
                'Only school name',
                'Teacher phone'
            ],
            correct: 1
        },
        {
            id: 4,
            question: 'What should be done if received ITN quantity does not match the dispatch note?',
            options: [
                'Ignore the difference',
                'Note discrepancy, contact dispatcher, document resolution',
                'Assume dispatcher is wrong',
                'Accept without verification'
            ],
            correct: 1
        },
        {
            id: 5,
            question: 'How is ITN condition assessed upon receipt?',
            options: [
                'No assessment needed',
                'Visual inspection for damage, torn nets, contamination before acceptance',
                'Only count quantity',
                'Trust the sender'
            ],
            correct: 1
        },
        {
            id: 6,
            question: 'What role does digital signature play in ITN receipt?',
            options: [
                'No role',
                'Confirms receiver identity and accountability for the shipment',
                'Only for formal paperwork',
                'Used for decoration'
            ],
            correct: 1
        },
        {
            id: 7,
            question: 'How should excess or damaged ITNs be handled?',
            options: [
                'Use them anyway',
                'Return to logistics coordinator with incident report',
                'Dispose without record',
                'Distribute to random schools'
            ],
            correct: 1
        },
        {
            id: 8,
            question: 'What triggers the ITN Received record completion?',
            options: [
                'Teacher approval',
                'PHU staff complete inspection, document quantities, and sign confirmation',
                'Random timing',
                'No trigger — optional'
            ],
            correct: 1
        },
        {
            id: 9,
            question: 'How can discrepancies between dispatch and receipt be minimized?',
            options: [
                'By ignoring differences',
                'Using QR codes, real-time tracking, and immediate reconciliation',
                'Manual counting only',
                'Accepting all without verification'
            ],
            correct: 1
        },
        {
            id: 10,
            question: 'What is the importance of timestamped ITN receipt records?',
            options: [
                'No importance',
                'Establishes accountability timeline and enables stock tracking at each location',
                'Only for decoration',
                'For legal penalties'
            ],
            correct: 1
        }
    ],

    attendance: [
        {
            id: 1,
            question: 'What does the Attendance & Payment module track?',
            options: [
                'Only school fees',
                'Field staff attendance, daily hours worked, and payment calculations',
                'Only student attendance',
                'Teacher performance ratings'
            ],
            correct: 1
        },
        {
            id: 2,
            question: 'Who is responsible for recording daily attendance?',
            options: [
                'Only supervisors',
                'Field staff themselves or team leaders at end of each day',
                'Only monitors',
                'Teachers'
            ],
            correct: 1
        },
        {
            id: 3,
            question: 'What are the key components of attendance records?',
            options: [
                'Name only',
                'Name, date, time in, time out, hours worked, location, supervisor confirmation',
                'Only hours',
                'Phone number'
            ],
            correct: 1
        },
        {
            id: 4,
            question: 'How is payment calculated based on attendance?',
            options: [
                'Flat rate regardless of hours',
                'Daily rate multiplied by verified hours worked minus deductions',
                'Random amount',
                'Not calculated'
            ],
            correct: 1
        },
        {
            id: 5,
            question: 'What should be done if a staff member misses a day?',
            options: [
                'No action',
                'Record absence with reason, supervisor note, and payment adjustment',
                'Pay full salary regardless',
                'Terminate employment'
            ],
            correct: 1
        },
        {
            id: 6,
            question: 'How are disputes about hours worked resolved?',
            options: [
                'Staff member wins automatically',
                'Supervisor review, team discussion, photo evidence, payment reconciliation',
                'Supervisor decides alone without discussion',
                'Pay disputed hours'
            ],
            correct: 1
        },
        {
            id: 7,
            question: 'What role does GPS location play in attendance?',
            options: [
                'No role',
                'Confirms staff presence at work locations',
                'Only for mapping',
                'For vehicle tracking'
            ],
            correct: 1
        },
        {
            id: 8,
            question: 'How is payment reconciliation done across all staff?',
            options: [
                'No reconciliation',
                'Weekly/monthly summary of all hours, rates, deductions, and net payment to each staff',
                'Only spot checks',
                'Random payments'
            ],
            correct: 1
        },
        {
            id: 9,
            question: 'What should happen before final payment is released?',
            options: [
                'Nothing — pay immediately',
                'Verify attendance, reconcile with budget, obtain authorizations, then process',
                'Pay half first',
                'No verification needed'
            ],
            correct: 1
        },
        {
            id: 10,
            question: 'How does digital attendance benefit the programme?',
            options: [
                'No benefits',
                'Reduces fraud, ensures accuracy, enables real-time reporting, fair payment',
                'Increases costs',
                'Slows operations'
            ],
            correct: 1
        }
    ],

    reconciliation: [
        {
            id: 1,
            question: 'What is the purpose of ITN Reconciliation?',
            options: [
                'To resolve disagreements between staff',
                'To match dispatch, movement, receipt, and distribution records to ensure stock integrity',
                'To assign blame',
                'To reduce ITN quantities'
            ],
            correct: 1
        },
        {
            id: 2,
            question: 'When should reconciliation be performed?',
            options: [
                'Never',
                'Weekly, at campaign milestones, and at campaign end',
                'Once a year',
                'Only if there are complaints'
            ],
            correct: 1
        },
        {
            id: 3,
            question: 'What records are reconciled together?',
            options: [
                'Only school names',
                'Initial stock, dispatch notes, movement records, receipt confirmations, distribution counts',
                'Only ITN quantities',
                'Teacher lists'
            ],
            correct: 1
        },
        {
            id: 4,
            question: 'How are discrepancies between records identified?',
            options: [
                'By guessing',
                'System compares quantities at each stage: Expected vs. Actual at each checkpoint',
                'Manual inspection only',
                'Not identified'
            ],
            correct: 1
        },
        {
            id: 5,
            question: 'What should be done when a reconciliation discrepancy is found?',
            options: [
                'Ignore it',
                'Investigate root cause, document findings, implement corrective action',
                'Blame the nearest person',
                'Assume it will resolve itself'
            ],
            correct: 1
        },
        {
            id: 6,
            question: 'What are common causes of ITN discrepancies?',
            options: [
                'Only theft',
                'Data entry errors, missing receipts, damaged nets not recorded, unofficial distributions',
                'Only weather',
                'Schools lying'
            ],
            correct: 1
        },
        {
            id: 7,
            question: 'How is reconciliation reported to leadership?',
            options: [
                'Verbally',
                'Formal reconciliation report with summary, findings, variance, and action plan',
                'Only if all matches',
                'Not reported'
            ],
            correct: 1
        },
        {
            id: 8,
            question: 'What role does digital data play in reconciliation?',
            options: [
                'No role',
                'Enables automated cross-checks, audit trails, and rapid discrepancy identification',
                'Complicates it',
                'Only for backup'
            ],
            correct: 1
        },
        {
            id: 9,
            question: 'How often should physical stock counts be done?',
            options: [
                'Never',
                'Before campaign start, during major milestones, and at campaign end',
                'Every day',
                'Only when suspected theft'
            ],
            correct: 1
        },
        {
            id: 10,
            question: 'What happens after reconciliation is complete?',
            options: [
                'Nothing',
                'Results shared with all stakeholders, feedback loop for process improvement',
                'Hidden from staff',
                'Only supervisors see it'
            ],
            correct: 1
        }
    ]
};

// ════════════════════════════════════════════════════
// CERTIFICATE GENERATOR
// ════════════════════════════════════════════════════

function generateCertificateSVG(userName, moduleLabel, completionDate) {
    const dateStr = new Date(completionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
    <svg viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <defs>
            <linearGradient id="certBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#002d5a;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#004080;stop-opacity:1" />
            </linearGradient>
            <filter id="shadow">
                <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.2"/>
            </filter>
        </defs>

        <!-- Main border frame -->
        <rect x="40" y="40" width="920" height="620" fill="none" stroke="#ffc107" stroke-width="8" rx="10"/>
        <rect x="50" y="50" width="900" height="600" fill="url(#certBg)" rx="8"/>

        <!-- Inner accent border -->
        <rect x="70" y="70" width="860" height="560" fill="none" stroke="#ffc107" stroke-width="3" opacity="0.6" rx="6"/>

        <!-- Header: ICF-SL Badge -->
        <circle cx="500" cy="120" r="50" fill="#ffc107" opacity="0.15"/>
        <text x="500" y="130" font-family="Oswald, sans-serif" font-size="32" font-weight="700" fill="#ffc107" text-anchor="middle" letter-spacing="2">ICF-SL</text>

        <!-- Title -->
        <text x="500" y="200" font-family="Oswald, sans-serif" font-size="48" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="3">CERTIFICATE OF</text>
        <text x="500" y="250" font-family="Oswald, sans-serif" font-size="48" font-weight="700" fill="#ffc107" text-anchor="middle" letter-spacing="3">COMPLETION</text>

        <!-- Decorative line -->
        <line x1="150" y1="280" x2="850" y2="280" stroke="#ffc107" stroke-width="2"/>

        <!-- Body text -->
        <text x="500" y="330" font-family="Oswald, sans-serif" font-size="14" fill="#e0e0e0" text-anchor="middle" letter-spacing="1" text-transform="uppercase">THIS CERTIFIES THAT</text>

        <!-- User name (prominently) -->
        <text x="500" y="390" font-family="Oswald, sans-serif" font-size="42" font-weight="700" fill="#ffc107" text-anchor="middle" letter-spacing="2">${userName.toUpperCase()}</text>

        <!-- Module info -->
        <text x="500" y="440" font-family="Oswald, sans-serif" font-size="16" fill="#e0e0e0" text-anchor="middle" letter-spacing="1">HAS SUCCESSFULLY COMPLETED THE COMPETENCY ASSESSMENT FOR</text>
        <text x="500" y="465" font-family="Oswald, sans-serif" font-size="24" font-weight="700" fill="#ffc107" text-anchor="middle">${moduleLabel.toUpperCase()}</text>

        <!-- Score -->
        <text x="500" y="510" font-family="Oswald, sans-serif" font-size="14" fill="#e0e0e0" text-anchor="middle" letter-spacing="1">WITH A PERFECT SCORE OF 100%</text>

        <!-- Date -->
        <text x="500" y="560" font-family="Oswald, sans-serif" font-size="14" fill="#b0b0b0" text-anchor="middle">Date: ${dateStr}</text>

        <!-- Footer seal -->
        <circle cx="500" cy="620" r="25" fill="none" stroke="#ffc107" stroke-width="2"/>
        <text x="500" y="625" font-family="Oswald, sans-serif" font-size="20" font-weight="700" fill="#ffc107" text-anchor="middle">✓</text>
    </svg>
    `;
}

function downloadCertificate(userName, moduleLabel, moduleId) {
    const svg = generateCertificateSVG(userName, moduleLabel, new Date());
    const svgData = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    
    const link = document.createElement('a');
    link.href = svgData;
    link.download = `Certificate_${moduleId}_${userName.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ════════════════════════════════════════════════════
// TRAINING MODAL UI
// ════════════════════════════════════════════════════

function openTrainingModal(moduleId, moduleLabel) {
    const modal = document.createElement('div');
    modal.id = `training_modal_${moduleId}`;
    modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.7);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: Oswald, sans-serif;
    `;

    const isCompleted = trainingSystem.isModuleCompleted(moduleId);
    const remaining = trainingSystem.getRemainingAttempts(moduleId);

    modal.innerHTML = `
        <div style="background: #fff; border-radius: 16px; width: 100%; max-width: 600px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.4);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg,#002d5a,#004080); color: #fff; padding: 24px; display: flex; align-items: center; gap: 16px;">
                <div style="width: 50px; height: 50px; background: rgba(255,255,255,.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">
                    ${isCompleted ? '✓' : '📚'}
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 18px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Training Module</div>
                    <div style="font-size: 14px; color: rgba(255,255,255,.8); margin-top: 4px;">${moduleLabel}</div>
                </div>
                <button onclick="document.getElementById('training_modal_${moduleId}').remove()" style="background: rgba(255,255,255,.2); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; flex-shrink: 0;">✕</button>
            </div>

            <!-- Body -->
            <div style="padding: 28px;">
                ${isCompleted ? `
                    <!-- Completed State -->
                    <div style="text-align: center;">
                        <div style="width: 80px; height: 80px; background: #e8f5ee; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 40px;">✓</div>
                        <div style="font-size: 22px; font-weight: 700; color: #004080; margin-bottom: 12px;">MODULE COMPLETED</div>
                        <div style="font-size: 14px; color: #607080; line-height: 1.6; margin-bottom: 24px;">
                            You have successfully completed the competency assessment for ${moduleLabel} with a score of 100%. Your certificate has been issued.
                        </div>
                        <button onclick="downloadCertificate('${trainingSystem.certsGenerated.get(moduleId)?.userName || 'User'}', '${moduleLabel}', '${moduleId}')" style="background: #ffc107; color: #004080; border: none; padding: 12px 24px; border-radius: 8px; font-family: Oswald; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 1px; width: 100%; text-transform: uppercase;">
                            📥 DOWNLOAD CERTIFICATE
                        </button>
                    </div>
                ` : `
                    <!-- Incomplete State -->
                    <div style="margin-bottom: 24px;">
                        <div style="background: #e8f1fb; border: 2px solid #004080; border-radius: 10px; padding: 16px; margin-bottom: 16px;">
                            <div style="font-size: 13px; color: #004080; font-weight: 700; letter-spacing: .5px; margin-bottom: 8px;">TRAINING REQUIRED</div>
                            <div style="font-size: 12px; color: #607080; line-height: 1.6;">
                                Complete the training video and pass the 10-question competency assessment with 100% to unlock this module.
                            </div>
                        </div>

                        <div style="display: flex; gap: 12px; flex-direction: column;">
                            <button onclick="showTrainingVideo('${moduleId}', '${moduleLabel}')" style="background: #004080; color: #fff; border: none; padding: 14px; border-radius: 8px; font-family: Oswald; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; text-transform: uppercase;">
                                <span style="font-size: 16px;">🎬</span> WATCH TRAINING VIDEO
                            </button>
                            <button onclick="startCompetencyQuiz('${moduleId}', '${moduleLabel}')" style="background: #ffc107; color: #004080; border: none; padding: 14px; border-radius: 8px; font-family: Oswald; font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; text-transform: uppercase;">
                                <span style="font-size: 16px;">📝</span> TAKE ASSESSMENT (${remaining} Attempts Left)
                            </button>
                        </div>

                        ${remaining === 0 ? `
                            <div style="background: #fff0f0; border: 1px solid #ffb3b3; border-radius: 8px; padding: 12px; margin-top: 16px; color: #c0392b; font-size: 12px;">
                                ⛔ Maximum attempts reached. Contact your supervisor for re-qualification.
                            </div>
                        ` : ''}
                    </div>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

// ════════════════════════════════════════════════════
// VIDEO PLAYER
// ════════════════════════════════════════════════════

function showTrainingVideo(moduleId, moduleLabel) {
    // Close existing modal
    const existing = document.getElementById(`training_modal_${moduleId}`);
    if (existing) existing.remove();

    const videoModal = document.createElement('div');
    videoModal.id = `video_modal_${moduleId}`;
    videoModal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.85);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    videoModal.innerHTML = `
        <div style="background: #000; border-radius: 12px; width: 100%; max-width: 900px; overflow: hidden; box-shadow: 0 20px 80px rgba(0,0,0,.6);">
            <div style="background: linear-gradient(135deg,#002d5a,#004080); color: #fff; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;">
                <div style="font-family: Oswald; font-size: 16px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">🎬 ${moduleLabel} Training Video</div>
                <button onclick="document.getElementById('video_modal_${moduleId}').remove(); openTrainingModal('${moduleId}', '${moduleLabel}')" style="background: rgba(255,255,255,.2); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; font-size: 16px; cursor: pointer;">✕</button>
            </div>
            <div style="aspect-ratio: 16/9; background: #000; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #999;">
                <div style="text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 12px;">🎬</div>
                    <div style="font-family: Oswald; font-size: 14px; color: #aaa;">Training video not yet uploaded</div>
                    <div style="font-size: 12px; color: #777; margin-top: 8px;">Configure video URL in MODULE_RESOURCES.${moduleId}.video</div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(videoModal);
    videoModal.onclick = (e) => {
        if (e.target === videoModal) {
            videoModal.remove();
            openTrainingModal(moduleId, moduleLabel);
        }
    };
}

// ════════════════════════════════════════════════════
// COMPETENCY ASSESSMENT QUIZ
// ════════════════════════════════════════════════════

function startCompetencyQuiz(moduleId, moduleLabel) {
    const remaining = trainingSystem.getRemainingAttempts(moduleId);
    if (remaining === 0) {
        alert('Maximum attempts reached for this module.');
        return;
    }

    // Close training modal
    const modal = document.getElementById(`training_modal_${moduleId}`);
    if (modal) modal.remove();

    // Get questions for module
    const allQuestions = QUESTION_BANKS[moduleId] || [];
    if (allQuestions.length === 0) {
        alert(`No questions available for ${moduleId}`);
        return;
    }

    // Shuffle and select 10 random questions
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const quizQuestions = shuffled.slice(0, Math.min(10, shuffled.length));

    // Create quiz UI
    const quizContainer = document.createElement('div');
    quizContainer.id = `quiz_${moduleId}`;
    quizContainer.style.cssText = `
        position: fixed;
        inset: 0;
        background: linear-gradient(135deg,#f0f4f8,#e8f1fa);
        z-index: 10000;
        overflow-y: auto;
        padding: 20px;
        font-family: Oswald, sans-serif;
    `;

    let currentQuestion = 0;
    let score = 0;
    const answers = new Array(quizQuestions.length).fill(null);

    function renderQuestion() {
        const q = quizQuestions[currentQuestion];
        const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

        let html = `
            <div style="max-width: 700px; margin: 0 auto; padding: 20px 0;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg,#002d5a,#004080); color: #fff; border-radius: 14px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,.15);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                        <div style="font-size: 28px;">📝</div>
                        <div style="flex: 1;">
                            <div style="font-size: 16px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">${moduleLabel} Competency Assessment</div>
                            <div style="font-size: 12px; color: rgba(255,255,255,.8); margin-top: 3px;">Question ${currentQuestion + 1} of ${quizQuestions.length}</div>
                        </div>
                    </div>
                    <div style="background: rgba(0,0,0,.2); height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; background: #ffc107; width: ${progress}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>

                <!-- Question -->
                <div style="background: #fff; border-radius: 12px; padding: 28px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.08);">
                    <div style="font-size: 18px; font-weight: 700; color: #004080; margin-bottom: 24px; line-height: 1.6;">${q.question}</div>

                    <!-- Options -->
                    <div style="display: flex; flex-direction: column; gap: 12px;">
        `;

        q.options.forEach((option, idx) => {
            const isSelected = answers[currentQuestion] === idx;
            const bgColor = isSelected ? '#e8f5ee' : '#f8fafc';
            const borderColor = isSelected ? '#28a745' : '#dde3ee';
            const textColor = isSelected ? '#1a7a3c' : '#004080';

            html += `
                <label onclick="selectAnswer(${idx})" style="
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px 16px;
                    background: ${bgColor};
                    border: 2px solid ${borderColor};
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                ">
                    <div style="
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        border: 2px solid ${borderColor};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        ${isSelected ? `background: #28a745; border-color: #28a745;` : ''}
                    ">
                        ${isSelected ? '<span style="color: #fff; font-weight: 700; font-size: 12px;">✓</span>' : ''}
                    </div>
                    <span style="font-size: 13px; color: ${textColor}; flex: 1;">${option}</span>
                </label>
            `;
        });

        html += `
                    </div>
                </div>

                <!-- Navigation -->
                <div style="display: flex; gap: 12px; justify-content: space-between;">
                    <button onclick="prevQuestion()" style="
                        padding: 12px 24px;
                        background: #f4f7fa;
                        border: 2px solid #dde3ee;
                        border-radius: 8px;
                        font-family: Oswald;
                        font-size: 13px;
                        font-weight: 700;
                        cursor: pointer;
                        color: #607080;
                        letter-spacing: .5px;
                        ${currentQuestion === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                    " ${currentQuestion === 0 ? 'disabled' : ''}>
                        ← BACK
                    </button>

                    <div style="display: flex; gap: 12px;">
                        ${currentQuestion < quizQuestions.length - 1 ? `
                            <button onclick="nextQuestion()" style="
                                padding: 12px 24px;
                                background: #004080;
                                border: none;
                                border-radius: 8px;
                                font-family: Oswald;
                                font-size: 13px;
                                font-weight: 700;
                                cursor: pointer;
                                color: #fff;
                                letter-spacing: .5px;
                                ${answers[currentQuestion] === null ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                            " ${answers[currentQuestion] === null ? 'disabled' : ''}>
                                NEXT →
                            </button>
                        ` : `
                            <button onclick="submitQuiz()" style="
                                padding: 12px 24px;
                                background: #28a745;
                                border: none;
                                border-radius: 8px;
                                font-family: Oswald;
                                font-size: 13px;
                                font-weight: 700;
                                cursor: pointer;
                                color: #fff;
                                letter-spacing: .5px;
                                ${answers[currentQuestion] === null ? 'opacity: 0.5; cursor: not-allowed;' : ''}
                            " ${answers[currentQuestion] === null ? 'disabled' : ''}>
                                SUBMIT & GET RESULTS
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;

        quizContainer.innerHTML = html;
    }

    window.selectAnswer = (idx) => {
        answers[currentQuestion] = idx;
        renderQuestion();
    };

    window.nextQuestion = () => {
        if (currentQuestion < quizQuestions.length - 1) {
            currentQuestion++;
            renderQuestion();
        }
    };

    window.prevQuestion = () => {
        if (currentQuestion > 0) {
            currentQuestion--;
            renderQuestion();
        }
    };

    window.submitQuiz = () => {
        // Calculate score
        let correct = 0;
        answers.forEach((ans, idx) => {
            if (ans === quizQuestions[idx].correct) correct++;
        });
        const percentage = Math.round((correct / quizQuestions.length) * 100);

        // Record attempt
        trainingSystem.recordAttempt(moduleId);

        // Show results
        showQuizResults(moduleId, moduleLabel, percentage, correct, quizQuestions.length);
        quizContainer.remove();
    };

    document.body.appendChild(quizContainer);
    renderQuestion();
}

function showQuizResults(moduleId, moduleLabel, percentage, correct, total) {
    const isPassed = percentage === 100;

    const resultModal = document.createElement('div');
    resultModal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    let userName = '';

    if (isPassed) {
        resultModal.innerHTML = `
            <div style="background: #fff; border-radius: 16px; max-width: 500px; width: 100%; overflow: hidden; box-shadow: 0 20px 80px rgba(0,0,0,.4);">
                <div style="background: linear-gradient(135deg,#1a7a3c,#28a745); color: #fff; padding: 40px 30px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 16px;">🎉</div>
                    <div style="font-family: Oswald; font-size: 28px; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">PERFECT SCORE!</div>
                    <div style="font-size: 14px; opacity: 0.9;">You have passed the competency assessment</div>
                </div>

                <div style="padding: 30px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 48px; font-weight: 700; color: #28a745; margin-bottom: 4px;">100%</div>
                        <div style="font-size: 13px; color: #607080; letter-spacing: .5px;">${correct} out of ${total} questions correct</div>
                    </div>

                    <div style="background: #e8f5ee; border: 2px solid #28a745; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
                        <div style="font-family: Oswald; font-size: 13px; font-weight: 700; color: #1a7a3c; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .5px;">Enter Your Name for Certificate</div>
                        <input type="text" id="certName" placeholder="Full Name" style="
                            width: 100%;
                            padding: 11px 14px;
                            border: 2px solid #28a745;
                            border-radius: 8px;
                            font-family: Oswald;
                            font-size: 13px;
                            box-sizing: border-box;
                            outline: none;
                        " onkeypress="if(event.key==='Enter') window.issueCertificate('${moduleId}', '${moduleLabel}')">
                    </div>

                    <button onclick="window.issueCertificate('${moduleId}', '${moduleLabel}')" style="
                        width: 100%;
                        padding: 14px;
                        background: #28a745;
                        border: none;
                        border-radius: 8px;
                        font-family: Oswald;
                        font-size: 14px;
                        font-weight: 700;
                        color: #fff;
                        cursor: pointer;
                        letter-spacing: .8px;
                        text-transform: uppercase;
                        margin-bottom: 8px;
                    ">✓ ISSUE CERTIFICATE</button>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        width: 100%;
                        padding: 14px;
                        background: #f4f7fa;
                        border: none;
                        border-radius: 8px;
                        font-family: Oswald;
                        font-size: 14px;
                        color: #607080;
                        cursor: pointer;
                        letter-spacing: .8px;
                    ">CLOSE</button>
                </div>
            </div>
        `;
    } else {
        const remaining = trainingSystem.getRemainingAttempts(moduleId);
        resultModal.innerHTML = `
            <div style="background: #fff; border-radius: 16px; max-width: 500px; width: 100%; overflow: hidden; box-shadow: 0 20px 80px rgba(0,0,0,.4);">
                <div style="background: linear-gradient(135deg,#c0392b,#dc3545); color: #fff; padding: 40px 30px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 16px;">❌</div>
                    <div style="font-family: Oswald; font-size: 28px; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">SCORE NOT 100%</div>
                    <div style="font-size: 14px; opacity: 0.9;">You must score 100% to pass</div>
                </div>

                <div style="padding: 30px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 48px; font-weight: 700; color: #dc3545; margin-bottom: 4px;">${percentage}%</div>
                        <div style="font-size: 13px; color: #607080; letter-spacing: .5px;">${correct} out of ${total} questions correct</div>
                    </div>

                    <div style="background: #fff8e1; border: 2px solid #ffc107; border-radius: 10px; padding: 14px; margin-bottom: 24px;">
                        <div style="font-size: 13px; color: #8a6500; line-height: 1.6;">
                            ${remaining > 0 ? `
                                You have <strong>${remaining}</strong> attempt${remaining === 1 ? '' : 's'} remaining. Review the training material and try again.
                            ` : `
                                <strong>No attempts remaining.</strong> Contact your supervisor for re-qualification.
                            `}
                        </div>
                    </div>

                    ${remaining > 0 ? `
                        <button onclick="startCompetencyQuiz('${moduleId}', '${moduleLabel}'); this.parentElement.parentElement.remove()" style="
                            width: 100%;
                            padding: 14px;
                            background: #ffc107;
                            border: none;
                            border-radius: 8px;
                            font-family: Oswald;
                            font-size: 14px;
                            font-weight: 700;
                            color: #004080;
                            cursor: pointer;
                            letter-spacing: .8px;
                            text-transform: uppercase;
                            margin-bottom: 8px;
                        ">↻ TRY AGAIN</button>
                    ` : ''}
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        width: 100%;
                        padding: 14px;
                        background: #f4f7fa;
                        border: none;
                        border-radius: 8px;
                        font-family: Oswald;
                        font-size: 14px;
                        color: #607080;
                        cursor: pointer;
                        letter-spacing: .8px;
                    ">CLOSE</button>
                </div>
            </div>
        `;
    }

    document.body.appendChild(resultModal);
}

window.issueCertificate = function(moduleId, moduleLabel) {
    const nameInput = document.getElementById('certName');
    const userName = (nameInput?.value || '').trim();

    if (!userName) {
        alert('Please enter your name');
        return;
    }

    // Mark module as completed
    trainingSystem.markCompleted(moduleId, userName);

    // Generate and download certificate
    downloadCertificate(userName, moduleLabel, moduleId);

    // Show confirmation
    const resultModal = document.querySelector('[style*="position: fixed"][style*="inset: 0"]');
    if (resultModal) resultModal.remove();

    const confirmation = document.createElement('div');
    confirmation.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #28a745;
        color: #fff;
        padding: 16px 20px;
        border-radius: 8px;
        font-family: Oswald;
        font-size: 13px;
        font-weight: 700;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,.2);
        animation: slideIn 0.3s ease;
    `;
    confirmation.innerHTML = '✓ Certificate downloaded and module unlocked';
    document.body.appendChild(confirmation);

    setTimeout(() => confirmation.remove(), 4000);

    // Unlock module in parent window
    if (window.opener && window.opener.trainingSystem) {
        window.opener.trainingSystem.markCompleted(moduleId, userName);
    }
};

// ════════════════════════════════════════════════════
// GLOBAL EXPORTS
// ════════════════════════════════════════════════════

window.trainingSystem = trainingSystem;
window.openTrainingModal = openTrainingModal;
window.startCompetencyQuiz = startCompetencyQuiz;
window.showTrainingVideo = showTrainingVideo;
window.downloadCertificate = downloadCertificate;
