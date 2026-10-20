import { describe, expect, it } from "vitest";
import { nomeArquivo, paraCsv } from "@/lib/csv";

const semBom = (s: string) => s.replace(/^\ufeff/, "");

describe("CSV", () => {
  it("começa com BOM, senão o Excel quebra os acentos", () => {
    expect(paraCsv(["Ação"], [["criação"]]).startsWith("\ufeff")).toBe(true);
  });

  it("usa ; como separador e CRLF entre linhas", () => {
    const csv = semBom(paraCsv(["a", "b"], [["1", "2"]]));
    expect(csv).toBe("a;b\r\n1;2");
  });

  it("protege campo com ponto e vírgula, aspas ou quebra de linha", () => {
    const csv = semBom(
      paraCsv(["x"], [["tem;ponto"], ['tem "aspas"'], ["tem\nquebra"]]),
    );
    expect(csv).toContain('"tem;ponto"');
    expect(csv).toContain('"tem ""aspas"""');
    expect(csv).toContain('"tem\nquebra"');
  });

  it("deixa nulo e indefinido como célula vazia", () => {
    expect(semBom(paraCsv(["a", "b"], [[null, undefined]]))).toBe("a;b\r\n;");
  });

  it("nomeia o arquivo com data e sem caractere proibido", () => {
    const nome = nomeArquivo("historico");
    expect(nome).toMatch(/^historico-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv$/);
  });
});
