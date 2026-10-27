from pathlib import Path
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject, DecodedStreamObject, DictionaryObject, NameObject,
    NumberObject, RectangleObject, TextStringObject,
)

root = Path('/Users/abishek/Mind Bridge - Local')
profile = Path('/opt/homebrew/share/ghostscript/iccprofiles/default_cmyk.icc').read_bytes()
for version in (4, 5, 6):
    source = root / f'tmp/pdfs/V{version}-300dpi.pdf'
    writer = PdfWriter()
    writer.append(PdfReader(source))
    icc = DecodedStreamObject()
    icc.set_data(profile)
    icc[NameObject('/N')] = NumberObject(4)
    intent = DictionaryObject({
        NameObject('/Type'): NameObject('/OutputIntent'),
        NameObject('/S'): NameObject('/GTS_PDFX'),
        NameObject('/OutputConditionIdentifier'): TextStringObject('Ghostscript default CMYK'),
        NameObject('/Info'): TextStringObject('Generic CMYK conversion; confirm printer profile before press'),
        NameObject('/DestOutputProfile'): writer._add_object(icc),
    })
    writer._root_object[NameObject('/OutputIntents')] = ArrayObject([writer._add_object(intent)])
    for page in writer.pages:
        page.trimbox = RectangleObject([9, 9, 801, 621])
        page.bleedbox = RectangleObject([0, 0, 810, 630])
    writer.add_metadata({
        '/Title': f'Ammortal Trifold - Design V{version}',
        '/Subject': '300 DPI CMYK; outside then inside; 11 x 8.5 inch trim; 0.125 inch bleed',
    })
    output = root / f'output/pdf/Ammortal-Design-V{version}-300DPI.pdf'
    with output.open('wb') as stream:
        writer.write(stream)
    check = PdfReader(output)
    assert len(check.pages) == 2
    for page in check.pages:
        assert list(page.mediabox) == [0, 0, 810, 630]
        images = [obj.get_object() for obj in page['/Resources']['/XObject'].values()
                  if obj.get_object().get('/Subtype') == '/Image']
        assert images
        for image in images:
            assert (image['/Width'], image['/Height']) == (3375, 2625)
            assert image['/ColorSpace'] == '/DeviceCMYK'
    print(f'{output.name}: 2 pages, 3375 x 2625 pixels per page, 300 DPI, CMYK, trim/bleed verified')
