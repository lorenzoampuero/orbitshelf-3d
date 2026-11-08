import type { BlogPostCopy, BlogSlug } from "./index";

/**
 * Blog posts in English. Editorial rule: no figure without a source, and what we have not measured we say so.
 * The numbers here are sums anyone can repeat or third-party data with its limits stated.
 */
export const blogEn: Record<BlogSlug, BlogPostCopy> = {
  "photo-to-3d-for-online-stores": {
    title: "From photo to 3D model for your online store: what works and what does not",
    summary: "A no-hype guide to turning product photos into 3D with AI: when it helps, when it does not and how to test it without overspending.",
    sections: [
      { h: "What it is and what it is not", p: ["Turning a photo into a 3D model with AI means an engine generates a three-dimensional shape from one or more images. It is not a scan: whatever the camera did not see (the back, the sides, small text) the engine makes up. That is why the result should be treated as a draft you review, not as a measurement."] },
      { h: "When it tends to work", p: ["Solid, matte products with a clear silhouette come out best: a mug, a shoe, a chair, a case. With two to four photos of the same product (front, back, sides) the engine has more to follow. Keeping the light and distance the same in every photo helps."] },
      { h: "When it is harder", p: ["Glass, polished metal, transparent materials, very thin objects and soft clothing with deep folds are hard cases for any engine. We have not yet measured how often they come out well on a real catalog, so we do not promise a percentage. If you sell those, test one or two products first and decide from what you see."] },
      { h: "The workflow we recommend", p: ["Photograph the product on a neutral background, generate the model, review it against a checklist (shape, surfaces, sides it invented, color, text and logos), approve it and only then publish it on the product page. In OrbitShelf every job shows its cost in credits before you confirm, and a model cannot be published without your approval."] },
      { h: "How to start without overspending", p: ["Pick one product of each type you sell, generate one of each and compare them with the photo. That tells you which part of your catalog is a good candidate before you commit to a big plan. If a product does not come out well, leave it out of the 3D catalog: a misleading model does more harm than no model."] },
    ],
  },

  "does-3d-increase-conversion": {
    title: "Does 3D on the product page raise sales? What is known and what is not",
    summary: "We review the available evidence carefully, explain why big percentage promises are unreliable and how to measure it in your own store.",
    sections: [
      { h: "What is usually promised", p: ["Many 3D and augmented reality vendors publish conversion gains of 25 %, 60 % or more. On the pages we reviewed we found no methodology (how much traffic, how long, what was compared), so we do not use those figures. A percentage with no method is not data, it is an ad."] },
      { h: "One controlled test, with its limits", p: ["The strongest evidence we found is a controlled test by a fashion brand (GANT) that reported roughly 6 % more conversion on products with 3D. It is a single case, from a large brand, published by the technology vendor. It works as a hint, not as a promise for your store."] },
      { h: "Why testing it in a small store is hard", p: ["A rough sum with the usual sample size formula (n ≈ 16 × p × (1 − p) ÷ d² per group, at 80 % power and 5 % significance): if your conversion rate is 2 %, detecting a 6 % relative lift (from 2.00 % to 2.12 %) takes on the order of 200,000 visits per group. A store with 10,000 visits a month cannot confirm an effect like that in a short test."] },
      { h: "What you can measure", p: ["How many people open the 3D viewer, how long they use it, whether they add to cart more afterwards and, above all, whether returns for \"it was not like the photo\" go down. Returns often show the effect with less traffic than conversion does. Compare similar products with and without 3D over several weeks, and note price or campaign changes so you do not credit 3D for something else."] },
      { h: "How we would set it up", p: ["Pick 10 to 20 products with similar traffic, add 3D to half of them, keep everything else the same for 4 to 6 weeks and watch returns, clicks and cart. If you see no difference, that is fine: you saved yourself from investing in the whole catalog. If you do, you have your own number, which is worth more than any in a blog."] },
    ],
  },

  "glb-obj-stl-which-format": {
    title: "GLB, OBJ or STL: which format you need for each use",
    summary: "What each format carries, what it is for and which to pick depending on whether you publish in a store, use a game engine or print.",
    sections: [
      { h: "GLB: the web format", p: ["GLB is the binary version of glTF: a single file that carries the shape, materials and textures. It is the standard format for web viewers and the natural option for an online store. If you want to show the product rotating on a page, this is what you need."] },
      { h: "OBJ: the shape, to take elsewhere", p: ["OBJ mostly stores geometry and is compatible with almost any modeling program, such as Blender. In OrbitShelf the exported OBJ carries geometry only, in meters. It is useful if you will keep editing the model or import it into another workflow, not for showing it on a website."] },
      { h: "STL: for printing", p: ["STL stores only the triangulated surface, with no color or textures, and is the input format for most 3D printers. In OrbitShelf the STL is in millimeters. Before printing, check the model is a closed solid and the scale is right."] },
      { h: "A quick table", p: ["Publish in a store or on the web: GLB. Keep editing in Blender or another program: GLB or OBJ. 3D print: STL. Game engine: GLB is usually the easiest to start with; confirm which format your engine prefers and check its guide."] },
      { h: "A common mistake", p: ["Exporting an OBJ or STL expecting it to carry colors. It does not: if you need materials and textures, use GLB. And remember an AI-generated model can have a different color from the real product: compare it with the photo before publishing."] },
    ],
  },

  "how-many-polygons-do-you-need": {
    title: "How many polygons does your model need? A rule-of-thumb guide",
    summary: "More polygons does not mean better. How to think about a model's weight depending on whether it is seen on a web page, in a game or printed.",
    sections: [
      { h: "Why it matters", p: ["Every triangle in a model has to be loaded and drawn. A very heavy model loads slowly, makes the product page sluggish and can fail on mid-range phones. One that is too simple loses its shape. The key is finding the middle for the use you have in mind."] },
      { h: "For the web and augmented reality", p: ["Load speed rules here. As a practical rule (not a standard), keep the model light: aim for a file of a few megabytes that spins smoothly on a mid-range phone. Also check the file size limit of the platform where you will publish."] },
      { h: "For games", p: ["The budget depends on the engine, the platform and how many objects appear on screen at once. A background object seen from afar needs much less detail than a hero object. Ask your team or check your engine's guide and export with that limit in mind."] },
      { h: "For printing", p: ["The triangle count matters less here; what matters is that the mesh is closed, with no holes or flipped faces, and thick enough in the thin parts. A very detailed model prints well if the mesh is healthy."] },
      { h: "How we handle it", p: ["In OrbitShelf you can review the model's diagnostics (triangles, vertices, file size), optimize it into a new version without losing the original and compare the two before choosing which to use. Always test on the most modest device your customers use."] },
    ],
  },

  "how-to-choose-an-ai-3d-engine": {
    title: "How to choose an AI engine for 3D: eight criteria and a test method",
    summary: "There is no best engine for everything. An orderly way to compare engines with your own products and decide with data.",
    sections: [
      { h: "Why there is no best engine", p: ["Each AI 3D engine has different strengths: some respect shape better, some give better textures, some are faster or cheaper. And what works for a mug may fail for a jacket. That is why you should compare with your products and not with the examples on each vendor's website."] },
      { h: "The eight criteria", p: ["1. Fidelity to the photo. 2. How it behaves with your category (clothing, shiny, thin). 3. Mesh quality: clean, with no holes or noise. 4. Textures and materials. 5. License: whether the result can be used commercially, confirmed in writing. 6. Speed and failure rate. 7. Cost per usable model, not per attempt. 8. What the vendor does with your data, for example whether it trains on it."] },
      { h: "The real cost is per usable model", p: ["If an engine costs half as much per attempt but needs three attempts to give something acceptable, it is not cheaper. Note how many attempts each product took and divide the spend by the models you did approve. That is the number that matters."] },
      { h: "A simple test method", p: ["Pick 10 products that represent your catalog (include a hard one). Generate each with every engine you want to compare, from the same photos. Score the criteria you care about from 1 to 5 and add them up. Keep the results in a sheet: it will help when new engines appear."] },
      { h: "What OrbitShelf does here", p: ["It lets you choose the engine on each job, shows the cost in credits before you confirm and keeps the history. We do not tell you one is the best: we give you the place to compare them with your photos. Our rule is to enable an engine only when it is tested and we have written confirmation that its license allows commercial use."] },
    ],
  },

  "first-3d-catalog-in-one-week": {
    title: "Your first 3D catalog in one week: a day-by-day plan",
    summary: "A practical plan to go from zero to a handful of published 3D products and measure whether they are worth it.",
    sections: [
      { h: "Day 1: choose the products well", p: ["Pick 5 to 10 products. Prioritize solid, matte ones with a clear silhouette, the ones with the most returns for \"it was not like the photo\" and the ones that get the most traffic. Leave transparent, shiny or very thin ones for later."] },
      { h: "Day 2: photo session", p: ["One session, with the same light and the same neutral background. Three or four angles per product: front, back and sides, at the same distance and height, with the whole object in frame. Remove third-party labels and logos you have no right to show."] },
      { h: "Day 3: generate, one attempt per product", p: ["Generate one model of each product. Do not repeat yet: first see how many come out well on the first attempt, because that number tells you what your catalog will really cost. Note each job's cost in credits before you confirm."] },
      { h: "Day 4: review calmly", p: ["Rotate each model and compare it with the real product: shape, surfaces, sides it invented, color and text. Approve the good ones. For doubtful ones, try another attempt or leave them out. A mediocre model on the page costs you trust."] },
      { h: "Day 5: optimize and publish", p: ["Check the weight, optimize if needed, export as GLB and publish it on the page or embed the viewer. Check how it looks on a modest phone."] },
      { h: "Days 6 and 7: measure", p: ["Note how many people open the viewer, whether they add to cart, and how returns on those products compare with similar ones. Decide from that whether to expand the catalog. If the result is neutral, that is fine: you learned for little spend."] },
    ],
  },
};
