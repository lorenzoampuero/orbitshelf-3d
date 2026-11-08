import type { LegalDocCopy } from "./index";
import type { LegalSlug } from "./labels";

/**
 * Legal texts in English. Placeholders filled by LegalDocument: {brand}, {operator}, {email}, {jurisdiction}.
 * A draft for a lawyer's review: it invents no company details and marks as pending whatever depends on the operator's decisions.
 */
export const legalEn: Record<LegalSlug, LegalDocCopy> = {
  privacy: {
    title: "Privacy policy",
    summary: "What data we process, why, who we share it with, how long we keep it and how you exercise your rights.",
    sections: [
      { h: "1. Who is responsible", p: ["{operator} is responsible for the personal data processed through {brand}. For any privacy question or request, write to {email}.", "If you use {brand} inside a company and upload data about your own customers, you are the controller of that data and we act as processor. The Data Processing Addendum (DPA) then applies."] },
      { h: "2. Data we collect", p: ["Account: the email you sign in with and, if you provide them, your workspace name and usage profile (for example store, games or design).", "Content you upload or generate: product photos, text descriptions (prompts) for text-to-3D, imported or generated 3D models, names, SKUs, measurements, tags, review notes and versions.", "Usage records: generation attempts, job history, credit movements, approval status and an activity log of your workspace.", "Integrations: if you connect a Shopify store we keep the store domain and the access permission Shopify gives us, encrypted. If you create an API key we keep only a fingerprint of it; the full value is shown once.", "Payments: once billing is switched on, an external provider (currently planned: Whop) processes the payment. We receive payment confirmations, the transaction identifier and the account it belongs to; we do not receive or store your card number.", "Technical data: a session cookie, your IP address, browser type and server logs, used for security, abuse prevention and diagnostics."] },
      { h: "3. Why we use it and on what basis", p: ["To provide the service you ask for (generate, review, optimize and export models, keep your credits and publish where you authorize). Basis: performance of the contract.", "To keep the service secure, prevent fraud and abuse and diagnose failures. Basis: legitimate interest.", "To keep accounting and tax records and handle claims. Basis: legal obligation and legitimate interest.", "To answer you when you write to us. Basis: performance of the contract or legitimate interest.", "We do not sell your data, do not use it for advertising and do not use your photos or models to train AI models."] },
      { h: "4. Cookies and similar technologies", p: ["We use strictly necessary cookies only: a session cookie that keeps you signed in (7 days) and, while you connect Shopify, a short anti-forgery cookie (10 minutes). We use no analytics or advertising cookies. Details are in the Cookie policy."] },
      { h: "5. Your photos and the AI provider", p: ["When you start an AI job, your photos (one to four) are re-encoded without metadata (including GPS location) and sent to the 3D generation provider you choose or that belongs to the engine. With text-to-3D, the description you write is sent. Do not include personal or confidential information in it.", "That provider processes the content under its own terms and privacy policy. It may leave the resulting file at a public, hard-to-guess web address for a time. We copy the file into private storage, but you should not upload photos of unreleased or confidential products.", "Do not upload photos of people or images you have no rights to."] },
      { h: "6. Who we share data with", p: ["With providers that deliver services to us: AI 3D generation, hosting, database and sign-in, billing, email and the store you connect. They receive only what they need for their function. The current list and its status are on the Subprocessors page.", "We may also disclose data if an authority requires it on a valid legal basis, or to defend our rights. If the business is merged or sold, the data will pass to the new controller with the same protections and we will tell you."] },
      { h: "7. International transfers", p: ["Some providers process data outside your country, including the United States. Where the law requires it we use appropriate safeguards, such as standard contractual clauses, and limit what is transferred."] },
      { h: "8. How long we keep data", p: ["Account data is kept while your account is active. Photos and models are kept until you delete them or close your account: deleting a model removes its 3D file and source photo from our storage, but not the copies the AI provider keeps under its own policy. What you move to the trash is kept for 30 days and then permanently deleted.", "Attempt and payment records are kept for as long as accounting and tax rules require. Security logs are kept for a limited period."] },
      { h: "9. Your rights", p: ["Depending on where you live you can ask for access, rectification, erasure, portability, objection and restriction of processing, and withdraw consent where it is the basis. This includes rights recognized by Chile's Law 19.628 and its amendments (Law 21.719, according to its entry-into-force schedule), the EU GDPR and laws such as California's CCPA.", "You can already download your models and export your job history from the workspace. For anything else write to {email}. We answer within the time limit set by the applicable law. If you are not satisfied, you can complain to the data protection authority in your country."] },
      { h: "10. Automated decisions", p: ["We do not make decisions about you that produce legal effects based only on automated processing. 3D generation is an automatic AI result on your own content, which you review and approve."] },
      { h: "11. Security", p: ["We apply the measures described on the Security page. No system is completely secure; if a breach affects your data we will notify you as the law requires."] },
      { h: "12. Children", p: ["The service is for businesses and professionals and is not directed to people under 18."] },
      { h: "13. Changes", p: ["When this policy changes we will update the date at the top and notify you of material changes before they take effect."] },
    ],
  },

  terms: {
    title: "Terms of use",
    summary: "The rules of the service: accounts, credits and payments, your content, AI results, limits of liability and governing law.",
    sections: [
      { h: "1. Agreement", p: ["These terms govern your use of {brand}, operated by {operator}. By creating a workspace or using the service you accept them. If you use it on behalf of a company, you confirm you can bind that company.", "These also form part of the agreement and you should read them: Privacy policy, Refund policy, Acceptable use policy, Ownership of results and the Data Processing Addendum."] },
      { h: "2. The service and its status", p: ["{brand} lets you generate 3D models from photos or text, import models, review them, optimize them, export them and publish them. Features marked Planned or In testing may not exist yet or may work in a limited way. We may change, suspend or withdraw features while the product is developed; if a change harms you significantly, we will tell you first and you can ask for a refund of unused credits."] },
      { h: "3. Age and accounts", p: ["You must be at least 18 and able to enter into contracts. Keep access to your email and your API keys secure: you are responsible for what happens in your workspace. Tell us right away if you suspect unauthorized access."] },
      { h: "4. Credits, plans and prices", p: ["The service runs on credits. Each job shows its cost in credits before you confirm it; that cost is what is deducted, unless the quote shown expires, in which case you are asked to review it again.", "A plan's monthly credits do not roll over to the next month. Credits from one-off packs do not expire while your account stays active. Credits have no cash value, cannot be transferred and cannot be exchanged for money.", "If a job fails because of a provider or our error, the credits are returned automatically. Prices are shown in US dollars and may exclude taxes and payment fees depending on your country. We may change prices going forward; changes do not affect what you already paid and, if you subscribe, we tell you before the next renewal."] },
      { h: "5. Payments, renewal and cancellation", p: ["An external provider processes payments. Plans renew every month until you cancel. You can cancel at any time from your subscription management link or by writing to {email}; cancelling prevents future renewals and you keep access until the end of the paid period.", "Refunds follow the Refund policy. If a payment is reversed or disputed, we may deduct the related credits or suspend the account while it is resolved."] },
      { h: "6. Your content", p: ["You keep all rights to the photos and data you upload. You grant us a limited, non-exclusive, revocable license to store, process and send them to our providers only to provide the service to you.", "You state that you own every image and text you upload, or have permission to process it, including any trademarks, logos and designs it shows. Do not upload photos of people or content you have no right to use."] },
      { h: "7. Acceptable use", p: ["You must follow the Acceptable use policy. In short: do not breach security or usage limits, do not access other workspaces, do not upload malicious files, do not overload the service and do not use it to infringe third-party rights or mislead buyers."] },
      { h: "8. AI-generated models", p: ["Generated models are approximations and can contain invented surfaces, colors, text and logos. You must review every model before using it and you are responsible for how you show it to buyers, including compliance with consumer protection and advertising rules. The service does not certify dimensions, safety or manufacturing quality. More detail on the AI use and transparency page."] },
      { h: "9. Ownership of results", p: ["We claim no ownership of the models you generate. Your rights to them depend on your rights to the source photo, the law of your country and the terms of the engine used. We do not guarantee that a generated model is free of third-party rights. See the Ownership of results page."] },
      { h: "10. API and integrations", p: ["If you use the API or connect services (for example Shopify), you must respect their limits and each third party's terms. API keys belong to your workspace: do not share or publish them. We may limit or revoke keys that are used abusively."] },
      { h: "11. Availability and support", p: ["We make a reasonable effort to keep the service available, but we do not guarantee it runs without interruption or errors, and third-party AI engines can fail or change. Unless there is a separate written agreement, there is no service level commitment. Support is by email at {email}."] },
      { h: "12. Warranties", p: ["To the extent permitted by law, the service is provided \"as is\" and \"as available\", without warranties of any kind, including fitness for a particular purpose. This does not limit rights the law of your country does not allow to be limited."] },
      { h: "13. Limitation of liability", p: ["To the extent permitted by law, we are not liable for indirect or consequential damages, lost profits, lost data or lost sales opportunities. Our total liability is limited to what you paid us in the 12 months before the claim. Nothing in these terms limits liability for willful misconduct, gross negligence or other cases the law does not allow to be limited."] },
      { h: "14. Indemnity", p: ["If a third party makes a claim against us over content you uploaded, over your use of the service contrary to these terms or over how you published a model, we will tell you about the claim and you will answer for the reasonable damages and costs that result, to the extent permitted by law."] },
      { h: "15. Suspension and termination", p: ["We may suspend or close access if you breach these terms, if there is a risk to the service or to others, or if the law requires it. Where possible we will tell you and give you the chance to fix it. You can stop using the service and delete your content at any time. When an account closes, unused plan credits are lost; pack credits can be refunded under the Refund policy."] },
      { h: "16. Governing law and disputes", p: ["These terms are governed by the laws of {jurisdiction}. Before going to court, the parties will try to resolve the dispute in good faith by writing to {email}. Mandatory consumer protections of your country of residence and your right to complain to the competent authority remain."] },
      { h: "17. Notices and changes", p: ["We will tell you by email or in the app about material changes before they take effect. If a clause is invalid, the rest stays in force. Questions about these terms: {email}."] },
    ],
  },

  cookies: {
    title: "Cookie policy",
    summary: "Which cookies we use (only the necessary ones), how long they last and how to control them.",
    sections: [
      { h: "1. What they are", p: ["Cookies are small files your browser stores when you visit a site. They remember that you are signed in or protect an operation."] },
      { h: "2. The ones we use", p: ["os_session: keeps you signed in. It is an HTTP-only cookie (page code cannot read it), SameSite Lax, signed and valid for 7 days. Strictly necessary.", "os_shopify_state: exists only while you connect your Shopify store. It protects against request forgery. It lasts 10 minutes and is deleted when the connection ends. Strictly necessary."] },
      { h: "3. The ones we do not use", p: ["We use no analytics, advertising, cross-site tracking or social media cookies. We do not load ad pixels either. That is why we show no banner to accept them: there is nothing to accept.", "If we add analytics or advertising in the future, we will say so here, update the date and ask for your consent before using them where the law requires it."] },
      { h: "4. Other services on the pages", p: ["If you start a payment, you will be taken to our billing provider's page, which uses its own cookies under its own policy. The same happens if you go to Shopify from the integration. We do not control those cookies."] },
      { h: "5. How to control them", p: ["You can delete or block cookies in your browser settings. If you block the session cookie you will not be able to sign in to the workspace."] },
    ],
  },

  refunds: {
    title: "Refund and cancellation policy",
    summary: "When credits or money are returned, how to cancel and what happens when a job fails.",
    sections: [
      { h: "1. If a job fails", p: ["If a generation job fails because of a provider or service error, the reserved credits go back to your balance on their own and you will see it in your credit history as \"Provider error refunded\". You do not have to ask."] },
      { h: "2. If you do not like the result", p: ["AI generation is probabilistic: two attempts with the same photo can give different results and some will not be useful to you. A correct result that does not meet your expectation does not entitle you to an automatic return of credits. That is why we show the cost before generating and suggest you try one product first."] },
      { h: "3. Refund of a purchase", p: ["First purchase: within 14 days of your first payment you can ask for a refund of the plan or pack if you have used less than 10 % of the credits purchased. We return the amount paid, minus any payment fees that cannot be recovered.", "Renewals: cancel before the renewal date to avoid the charge. If we charge a renewal you cancelled in time, we refund it in full.", "Credits already used are not refunded. A plan's monthly credits do not roll over to the next month.", "Duplicate charges or errors on our side are always refunded."] },
      { h: "4. How to cancel", p: ["You can cancel your subscription whenever you want from your payment management link or by writing to {email}. You keep the credits and access until the end of the paid period."] },
      { h: "5. How to ask for a refund", p: ["Write to {email} from your account email with the payment identifier. We answer within 5 business days. If approved, the refund goes to the original payment method and may take as long as your bank takes."] },
      { h: "6. Chargebacks and disputes", p: ["If you have a problem with a charge, write to us first: we solve it faster than a bank dispute. If a chargeback is opened, we may remove the related credits and suspend the account while it is resolved."] },
      { h: "7. Rights that cannot be limited", p: ["This policy does not limit the rights your country's consumer law gives you, including withdrawal or warranty rights where they apply."] },
    ],
  },

  "acceptable-use": {
    title: "Acceptable use policy",
    summary: "What is not allowed on the service: prohibited content, technical abuse and resale.",
    sections: [
      { h: "1. What this policy is for", p: ["It protects the service, other users and third parties. It is part of the Terms of use. If you break it we may remove content, limit your account or close it."] },
      { h: "2. Content you may not upload or request", p: ["Sexual content involving minors or any child exploitation material.", "Photos or models of identifiable people without their permission, including anything used to impersonate or deceive.", "Protected brands, logos, characters or designs you have no permission to use. In text-to-3D do not ask for copyrighted characters, brand logos or real people.", "Objects designed to cause harm: working weapons or parts for making them, explosives, devices to defeat security measures.", "Content that is illegal in your country or ours, or that incites hatred, violence or harassment.", "Files with malware, or photos with third-party personal data without a legal basis."] },
      { h: "3. What you may not do with the service", p: ["Try to bypass security, usage limits, credit controls or the isolation between workspaces.", "Access other users' workspaces, models or keys.", "Overload the service with automated requests beyond your plan's limits, or spread use across several accounts to avoid them.", "Reverse engineer the service, or bulk-extract models or data that are not yours.", "Use the API with shared or published keys."] },
      { h: "4. Resale and competing use", p: ["You can use the models you generate in your products and in services to your customers. You may not resell access to {brand} or its engines as your own generation service, or use the service to build a product that competes with it, without a written agreement."] },
      { h: "5. Present models honestly", p: ["Do not present a generated model as a measurement, a certification or a quality guarantee. Do not show buyers a model you know does not represent the real product. You are responsible for reviewing every model before using it."] },
      { h: "6. How to report a violation", p: ["Write to {email} with the link or identifier of the content and what it breaks. For copyright use the procedure on the Copyright page."] },
      { h: "7. What we do about a violation", p: ["Depending on severity we may warn, remove the content, suspend or close the account and, where the law requires, inform the authorities. Where possible we will explain the reason and you will be able to respond."] },
    ],
  },

  "ip-and-outputs": {
    title: "Ownership of results and licenses",
    summary: "Who owns what you generate, which rights we give you and the limits of AI engines.",
    sections: [
      { h: "1. What you upload", p: ["Your photos, descriptions and imported models stay yours. You only give us the permission needed to process them and deliver the result (see the Terms of use)."] },
      { h: "2. What we generate for you", p: ["{brand} claims no ownership of the 3D models generated from your content. We assign to you, to the extent we can, any rights we hold in them so you can use them, including commercially."] },
      { h: "3. Limits you should know", p: ["Copyright: in some countries works created only by AI may have no copyright protection, or it may depend on how much a person contributed. If you need exclusivity or protection, ask an intellectual property lawyer.", "What resembles something existing: a model may resemble a product, character or design protected by third-party rights. You are responsible for checking that it does not infringe.", "Your photos: if the source photo carries a third party's rights (a photographer, a brand), those rights still reach the derived model."] },
      { h: "4. Engine terms", p: ["Each AI engine has its own terms on the use of what it generates. Our rule is to enable only engines whose terms let our customers use the result commercially, and to tell you in the product if an engine has restrictions. Those confirmations are requested in writing from each provider before enabling it."] },
      { h: "5. Using your content to train AI", p: ["We do not use your photos or models to train our own AI models. Engine providers have their own policies on the data they process; we review them before enabling an engine and prefer those that do not train on customer data."] },
      { h: "6. Our property", p: ["The software, design, texts, marks and documentation of {brand} belong to {operator} or its licensors. No right in them is transferred to you beyond using the service. The example models on the website are demonstrations and you may not reuse them as your own unless stated otherwise."] },
      { h: "7. Feedback you send us", p: ["If you give us ideas or suggestions, we may use them to improve the service without owing you payment or credit. Do not include confidential information."] },
    ],
  },

  "ai-disclosure": {
    title: "AI use and transparency",
    summary: "How models are generated, their limits, how to flag that they are AI-generated and what we do today.",
    sections: [
      { h: "1. Which part of the service uses AI", p: ["Generating 3D models from photos or text is done by third-party AI engines. The other functions (importing a GLB, reviewing, optimizing, comparing versions, exporting, publishing) do not use generative AI to create new content."] },
      { h: "2. Limits you must assume", p: ["AI invents what it cannot see: the back, the sides, small text and logos. Transparent materials, reflections and soft garments are hard cases. We have not yet measured the success rate on a real catalog, so we do not promise a percentage.", "That is why each model goes through a review checklist and your approval before it can be published."] },
      { h: "3. Transparency toward your customers", p: ["If you publish a model in a store or marketing material, do not present it as a photograph or a scan of the real object unless it is one. Say it is a 3D representation and, where appropriate, that it was generated with AI support.", "Some rules, such as Article 50 of the EU AI Act, require synthetic content to be disclosed or marked in certain cases. Its application schedule changes and the rules differ by use, so ask a lawyer if you sell in the European Union."] },
      { h: "4. What we do today", p: ["Product models appear in the workspace with their origin (AI-generated, imported) and approval status. The public viewer works only with approved models.", "Automatic machine-readable marking of generated files is not implemented yet. We will announce it here when it is."] },
      { h: "5. Human oversight", p: ["No model is published until a person on your team has reviewed and approved it. The input data is yours, and we make no automated decisions about you from it."] },
      { h: "6. How to tell us about a problem", p: ["If a model contains content it should not (for example a logo or a recognizable face) or a misleading result, write to {email} with the model identifier."] },
    ],
  },

  security: {
    title: "Security",
    summary: "The technical and organizational measures we apply and what we do not have yet.",
    sections: [
      { h: "1. What we do", p: ["Signed sessions with an HTTP-only cookie and protection against requests from other sites (CSRF).", "Each workspace is isolated from the others: a user cannot view, modify, download or delete another workspace's models.", "Uploaded files are validated by type and size. Photos have their metadata, including GPS location, removed before they are sent to an engine.", "API keys have limited scopes, are shown once, are stored only as a fingerprint and can be revoked whenever you want.", "Incoming webhooks (payments, Shopify, engines) are accepted only with a valid signature and a size limit; the credits for a payment are added once even if the notice arrives repeated.", "Service secrets live in environment variables and are not written to logs or the repository."] },
      { h: "2. What we do not have yet", p: ["We do not have certifications such as ISO 27001 or SOC 2, and we have not had an external audit or a penetration test. We claim none of them. This is a young service: if your company requires them, write to us and we will see what can be agreed."] },
      { h: "3. Accounts and access", p: ["In production, access will be through a single-use link sent to your email, with no password (today there is a local sign-in for development only). We recommend a corporate email with two-step verification.", "Be careful with the permissions you give integrations and revoke the ones you no longer use."] },
      { h: "4. Backups and continuity", p: ["Our database provider keeps backups according to its plan. We have not yet defined or tested a recovery plan with committed times; we offer no guaranteed recovery objective."] },
      { h: "5. Incidents", p: ["If we detect a breach affecting your data, we will notify you without undue delay with the information available: what happened, which data and what we are doing. We will meet the deadlines set by the applicable law."] },
      { h: "6. How to report a vulnerability", p: ["If you find a security flaw, write to {email} with steps to reproduce it. We ask that you do not access other users' data, do not degrade the service and give us reasonable time to fix it before disclosing it. We will be grateful for your report and will not start legal action over good-faith research that follows these rules."] },
    ],
  },

  subprocessors: {
    title: "Subprocessors and providers",
    summary: "Which third parties process data to provide the service, for what and in what state.",
    sections: [
      { h: "1. How to read this list", p: ["We use third parties to provide the service. This page groups them by function and says whether they are active or planned. The names of AI engine providers are added when each engine is enabled; until then they appear as \"to be defined\". We will tell you about material changes to this list with reasonable notice."] },
      { h: "2. AI 3D generation", p: ["Function: turn photos or text into 3D models. Data: the photos (without metadata) or the description and job parameters. Who: AI engine providers, to be defined when each engine is enabled. Location: mainly the United States. Status: being integrated; engines are enabled only after written confirmation that the terms allow commercial use and resale of the service."] },
      { h: "3. Hosting and delivery of the application", p: ["Function: run the application and serve the pages. Data: traffic and technical logs. Who: hosting provider, to be defined. Status: pending selection for production."] },
      { h: "4. Database and sign-in", p: ["Function: store accounts, models, credits and records, and send sign-in links by email. Data: email, workspace content, usage records. Who: Supabase (a new account dedicated to the product). Status: planned; today the service runs on local storage in development."] },
      { h: "5. Billing", p: ["Function: process payments and subscriptions and issue confirmations. Data: payment identifier, amount, email and billing details you give the provider. Who: Whop. Status: integration prepared and tested with simulations, pending a test with a real payment. We do not receive your card number."] },
      { h: "6. Stores you connect", p: ["Function: publish models to your store. Data: store domain, access permission (encrypted) and the products and files you decide to publish. Who: Shopify, only if you connect your store. Status: in testing."] },
      { h: "7. Email and support", p: ["Function: answer you. Data: the content of your messages. Who: the operator's email provider. Status: to be defined."] },
    ],
  },

  dpa: {
    title: "Data Processing Addendum (DPA)",
    summary: "Terms for when we process third-party personal data on your behalf, in line with the GDPR and data protection laws.",
    sections: [
      { h: "1. Scope and roles", p: ["This addendum applies when, using {brand}, you give us personal data of third parties (for example people who appear in a photo by mistake, or your team's data) and you decide why and how it is processed. In that case you are the controller and {operator} is the processor. For your own account data we are an independent controller, under the Privacy policy.", "This text is a contractual summary. If your company needs a DPA signed by both parties, write to us at {email}."] },
      { h: "2. What we process and why", p: ["Subject matter: providing the service. Duration: while you have the account. Nature: storing, processing with AI, transforming and exporting your content. Data types: whatever appears in the content you upload; we neither ask for nor expect sensitive data. Categories of people: your users and, accidentally, people in photos."] },
      { h: "3. Our obligations as processor", p: ["Process the data only on your documented instructions, which are these terms and how you use the service.", "Ensure the people with access are bound by confidentiality.", "Apply the security measures on the Security page.", "Help you, within reason, to answer data subject requests and meet your security, impact assessment and notification obligations.", "Tell you without undue delay if we become aware of a security breach affecting your data.", "When the service ends, delete or return the data as you choose, unless the law requires keeping it."] },
      { h: "4. Subprocessors", p: ["You authorize the providers on the Subprocessors page. We undertake to impose equivalent protections on them and to tell you before adding or changing a material one, so you can object; if we cannot agree, you can cancel and receive a refund of what is unused."] },
      { h: "5. International transfers", p: ["Data may be processed outside your country, including the United States. Where the law requires it, the transfer relies on standard contractual clauses or another valid safeguard."] },
      { h: "6. Audit", p: ["We will make available the reasonable information needed to show compliance with this addendum and will allow reasonable audits on prior notice, once a year unless there is a breach, and without access to other customers' data."] },
      { h: "7. Liability", p: ["The limitation of liability in the Terms of use also applies to this addendum, to the extent the law allows."] },
    ],
  },

  dmca: {
    title: "Copyright and content removal (DMCA)",
    summary: "How to tell us about content that infringes your rights and how to respond if you think it was removed by mistake.",
    sections: [
      { h: "1. We respect third-party rights", p: ["We do not allow uploading content you have no rights to. If you believe a model, photo or public page of {brand} infringes your copyright or trademark, tell us using this procedure."] },
      { h: "2. How to send a notice", p: ["Write to {email} with the subject \"Copyright notice\" and include: your name and contact details; which work is protected; the exact link or identifier of the content on {brand}; a good-faith statement that the use is not authorized; a statement, under your responsibility, that the information is accurate and that you are the owner or act on their behalf; and your signature (your typed name is fine)."] },
      { h: "3. What we do when we receive it", p: ["We review the notice. If it looks well-founded, we remove or disable the content and tell the person who uploaded it, with a copy of the notice (without your private details if you ask)."] },
      { h: "4. Counter-notice", p: ["If you believe we removed content by mistake or that you have the right to use it, write to {email} with the subject \"Counter-notice\" and include: the affected content and its former location; a good-faith statement that it was removed by mistake; your name, address and acceptance of the relevant jurisdiction; and your signature. If the complainant does not start legal action within a reasonable time (10 business days), we may restore the content."] },
      { h: "5. Repeat infringers", p: ["We close the accounts of people who infringe rights repeatedly."] },
      { h: "6. False notices", p: ["Sending a notice or counter-notice you know to be false can have legal consequences. Ask a lawyer before sending one if in doubt."] },
      { h: "7. Designated agent", p: ["Copyright agent: {operator}, contact {email}. Formally registering an agent with the US Copyright Office is a pending decision for the operator; until then this procedure applies to all notices."] },
    ],
  },

  accessibility: {
    title: "Accessibility",
    summary: "Our commitment to a web everyone can use, what we test and how to report a barrier.",
    sections: [
      { h: "1. Our goal", p: ["We want {brand} to be usable with a keyboard, a screen reader and different screen sizes. We take the WCAG 2.1 level AA guidelines as our reference."] },
      { h: "2. What we do", p: ["Pages with a heading structure and keyboard navigation, with visible focus and a skip-to-content link.", "Enough color contrast and text that can be enlarged without breaking the layout. We avoid text smaller than 12 pixels.", "We respect the operating system's reduced-motion preference.", "Automated accessibility tests (axe) on the public pages in every release, on desktop and mobile, with no horizontal overflow."] },
      { h: "3. What is not guaranteed yet", p: ["Automated tests catch only part of the problems. We have not done a full manual audit with assistive technology users, and the 3D viewer has limits for people who do not use a mouse or touch. We do not claim full WCAG conformance."] },
      { h: "4. How to tell us about a barrier", p: ["Write to {email} with the page, what you were trying to do and what stopped you, and your browser or assistive technology. We answer within 5 business days and, where we can, offer another way to get the information."] },
    ],
  },

  "legal-notice": {
    title: "Legal notice",
    summary: "Who owns the site, how to contact them and the status of the brand.",
    sections: [
      { h: "1. Site owner", p: ["The site and the {brand} service are operated by {operator}. The identification details (tax ID, address and country) appear in the \"Who operates this service\" box of each legal document and must be complete before the service is offered to the public.", "Contact: {email}."] },
      { h: "2. Brand and name", p: ["\"OrbitShelf 3D\" is a working name. There is no trademark registration and neither its availability nor that of the domain has been verified. It may change, and if it does we will announce it and keep access to your account and models."] },
      { h: "3. Site content", p: ["The texts, design and code belong to {operator} or its licensors. You may link to the public pages. You may not copy the site or present it as yours. Third-party brand names mentioned (for example Shopify, Blender or Whop) belong to their owners and are used only to identify compatibility; they imply no endorsement or affiliation."] },
      { h: "4. Information on the site", p: ["We try to keep the information accurate, but the product is in development and may change. When something has not been measured, we say so. Comparisons with other services are our assessments at the date shown and may become outdated."] },
      { h: "5. Links to other sites", p: ["We do not control the third-party sites we link to and are not responsible for their content."] },
      { h: "6. Law and courts", p: ["This notice is governed by the laws of {jurisdiction}, without prejudice to the mandatory protections that apply in your country of residence."] },
      { h: "7. Status of this document", p: ["This notice is a draft for legal review. It is not legal advice."] },
    ],
  },
};
