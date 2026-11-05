"""Turns the policy .docx files into clean HTML fragments for the website and web app.

Run after replacing any .docx in this folder:
    for f in terms safeguarding anonymity company-policy; do pandoc src/legal/$f.docx -t html5 --wrap=none -o src/legal/$f.raw.html; done
    python3 src/legal/clean.py

It removes the drafting notes meant for the company (title block, "drafting template" notes,
pre-launch checklists), fills in contact details we know, and marks anything still to be completed.
"""
import pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
SUPPORT_EMAIL = "mindguideai@gmail.com"
TBC = '<span class="tbc">to be confirmed</span>'

DOCS = {
    "terms": {"title": "Terms of Use", "summary": "Rules governing access to and use of the MindGuide AI Platform", "status": "Draft for review · Version 1.0"},
    "safeguarding": {"title": "Safeguarding Policy", "summary": "Preventing, identifying and responding to abuse, exploitation, neglect and harm", "status": "Draft for review · Version 1.0"},
    "anonymity": {"title": "User Anonymity and Protection Framework", "summary": "Identity, access, consent, counselling and crisis safeguards for users", "status": "Draft for review · Version 1.0"},
    "company-policy": {"title": "Company Policy", "summary": "Governance, conduct, safeguarding and service standards", "status": "Draft for review · Version 1.0"},
}


def drop_section(html, heading_text):
    """Removes an <h1> section (heading and everything up to the next <h1>)."""
    m = re.search(r'<h1[^>]*>[^<]*' + re.escape(heading_text) + r'[^<]*</h1>', html)
    if not m:
        return html
    nxt = html.find("<h1", m.end())
    return html[: m.start()] + (html[nxt:] if nxt != -1 else "")


def clean(name, html):
    # Title block (company name, title, subtitle, draft line) is rendered by the page itself.
    first_h1 = html.find("<h1")
    html = html[first_h1:]
    # Notes addressed to the company, not to readers.
    html = re.sub(r"<p><strong>Important:</strong> This is a practical drafting template.*?</p>", "", html, flags=re.S)
    html = re.sub(r"<p>Before publication, complete.*?</p>", "", html, flags=re.S)
    html = re.sub(r"<p>Do not claim emergency monitoring.*?</p>", "", html, flags=re.S)
    html = re.sub(r"<p>This document is a (governance|drafting) template.*?</p>", "", html, flags=re.S)
    html = re.sub(r"<p>Until these details are completed and verified, this document is a publication draft only\.</p>", "", html)
    html = html.replace(" Until these details are completed and verified, this document is a publication draft only.", "")
    html = html.replace("This is a draft for internal adoption. ", "")
    html = html.replace(" Insert the correct CAC-registered legal name, address, responsible officers and contact details before approval.", "")
    html = drop_section(html, "Appendix: pre-launch checklist")
    html = drop_section(html, "Pre-launch checklist")
    if name == "terms":
        html = re.sub(r"<h1([^>]*)>18\. Contact and publication checklist</h1>", r"<h1\1>18. Contact</h1>", html)
    # Known details
    html = re.sub(r"\\?\[Insert monitored email\\?\]", f'<a href="mailto:{SUPPORT_EMAIL}">{SUPPORT_EMAIL}</a>', html)
    html = re.sub(r"\[Insert monitored email\]", f'<a href="mailto:{SUPPORT_EMAIL}">{SUPPORT_EMAIL}</a>', html)
    # Anything else still to complete
    html = re.sub(r"\[[Ii]nsert [^\]]*\]", TBC, html)
    # Headings: the page title is the only h1
    html = re.sub(r"<h1", "<h2", html).replace("</h1>", "</h2>")
    html = re.sub(r"<h2([^>]*)>", r"<h2\1>", html)
    html = re.sub(r"<colgroup>.*?</colgroup>", "", html, flags=re.S)
    html = re.sub(r'<tr class="(odd|even|header)">', "<tr>", html)
    html = re.sub(r"<th><strong>(.*?)</strong></th>", r"<th>\1</th>", html)
    html = html.replace("<table>", '<div class="table-wrap legal-table"><table>').replace("</table>", "</table></div>")
    return html.strip()


def toc(html):
    items = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', html)
    return [(i, re.sub(r"<[^>]+>", "", t)) for i, t in items]


if __name__ == "__main__":
    for name in DOCS:
        raw = (HERE / f"{name}.raw.html").read_text()
        (HERE / f"{name}.html").write_text(clean(name, raw) + "\n")
        print(name, len(toc(clean(name, raw))), "sections")
