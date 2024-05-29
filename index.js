const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// Configuración
const config = {
    numberOfCards: 100, // Número de cartones a generar
    imageUrl: './logo2.png', // Ruta a la imagen que deseas usar
    borderColor: [1, 53, 173], // Color de los bordes en formato RGB
    bingoBgColor: [1, 53, 173], // Color de fondo para la palabra BINGO en formato RGB
    bingoColor: [255, 255, 255], // Color de la palabra BINGO en formato RGB
    pageSize: 'A4', // Tamaño de la página: 'A4' o 'Letter'
    letterFontSize: 48, // Tamaño de las letras "BINGO"
    numberFontSize: 48, // Tamaño de los números
    marginTop: 50, // Margen superior
    marginBottom: 50, // Margen inferior
    marginLeft: 50, // Margen izquierdo
    marginRight: 50, // Margen derecho
};

async function generateBingoCard() {
    const card = { B: [], I: [], N: [], G: [], O: [] };
    const ranges = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };

    for (const letter in ranges) {
        const [start, end] = ranges[letter];
        const numbers = [];
        while (numbers.length < 5) {
            const num = Math.floor(Math.random() * (end - start + 1)) + start;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        card[letter] = numbers;
    }

    card.N[2] = 'FREE';
    return card;
}

async function createBingoCardPDF(cards, config) {
    const pdfDoc = await PDFDocument.create();
    const standardFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = config.pageSize === 'A4' ? 595.28 : 612;
    const pageHeight = config.pageSize === 'A4' ? 841.89 : 792;

    const availableWidth = pageWidth - config.marginLeft - config.marginRight;
    const availableHeight = pageHeight - config.marginTop - config.marginBottom;
    const cellSize = Math.min(availableWidth / 5, availableHeight / 6);

    for (const card of cards) {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const { width, height } = page.getSize();
        const borderRGB = rgb(...config.borderColor.map(c => c / 255));
        const bingoBgRGB = rgb(...config.bingoBgColor.map(c => c / 255));
        const bingoRGB = rgb(...config.bingoColor.map(c => c / 255));

        const startX = (width - cellSize * 5) / 2;
        const startY = height - config.marginTop - cellSize;

        // Draw the Bingo letters with background
        for (let i = 0; i < 5; i++) {
            const x = startX + i * cellSize;
            page.drawRectangle({
                x,
                y: startY,
                width: cellSize,
                height: cellSize,
                color: bingoBgRGB,
                borderColor: borderRGB,
                borderWidth: 2,
            });
            page.drawText('BINGO'[i], {
                x: x + cellSize / 2 - config.letterFontSize / 2,
                y: startY + cellSize / 2 - config.letterFontSize / 2,
                size: config.letterFontSize,
                font: boldFont,
                color: bingoRGB,
            });
        }

        // Draw the Bingo grid
        const letters = ['B', 'I', 'N', 'G', 'O'];
        for (let i = 0; i < letters.length; i++) {
            for (let j = 0; j < 5; j++) {
                const x = startX + i * cellSize;
                const y = startY - (j + 1) * cellSize;

                // Draw cell border
                page.drawRectangle({
                    x,
                    y,
                    width: cellSize,
                    height: cellSize,
                    borderColor: borderRGB,
                    borderWidth: 2,
                });

                // Add cell content
                if (i === 2 && j === 2) {
                    // Draw center image
                    const imageBytes = fs.readFileSync(config.imageUrl);
                    const image = await pdfDoc.embedPng(imageBytes);
                    page.drawImage(image, {
                        x: x + 5,
                        y: y + 5,
                        width: cellSize - 10,
                        height: cellSize - 10,
                    });
                } else {
                    // Draw number
                    page.drawText(card[letters[i]][j].toString(), {
                        x: x + cellSize / 2 - config.numberFontSize / 2,
                        y: y + cellSize / 2 - config.numberFontSize / 2,
                        size: config.numberFontSize,
                        font: boldFont,
                        color: borderRGB,
                    });
                }
            }
        }
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('bingo_cards2.pdf', pdfBytes);
}

(async () => {
    const cards = await Promise.all(Array.from({ length: config.numberOfCards }, generateBingoCard));
    await createBingoCardPDF(cards, config);
})();
