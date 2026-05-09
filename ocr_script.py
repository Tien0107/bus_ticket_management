import fitz # PyMuPDF
import pytesseract
from PIL import Image
import io
import time
from docx import Document

# Set paths
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
import os
os.environ["TESSDATA_PREFIX"] = r"C:\Users\Admin\tessdata"
tessdata_dir_config = ''

pdf_file = "hhh.pdf"
doc = fitz.open(pdf_file)
word_doc = Document()

print(f"Starting OCR on {pdf_file} with {len(doc)} pages...")
start_time = time.time()

for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    pix = page.get_pixmap(dpi=300)
    img = Image.open(io.BytesIO(pix.tobytes("png")))
    
    # Run OCR
    text = pytesseract.image_to_string(img, lang="vie", config=tessdata_dir_config)
    if text.strip():
        word_doc.add_paragraph(text)
    print(f"Page {page_num + 1}/{len(doc)} processed in {time.time()-start_time:.1f} sec.")

word_doc.save("hhh_ocr.docx")
print("Done saving hhh_ocr.docx")
