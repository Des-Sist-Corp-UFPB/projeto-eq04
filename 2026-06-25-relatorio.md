# Relatório de Avaliação — EQ04 (DSC)

| | |
|---|---|
| **Data** | 2026-06-25 |
| **Repositório** | https://github.com/des-sist-corp-ufpb/projeto-eq04 |
| **Aplicação** | https://eq04.dsc.rodrigor.com |
| **Período de atividade** | 2026-06-09 → 2026-06-09 |
| **Total de commits** (sem merges) | 1 |
| **Integrantes** | Jose Samuel De Melo Santos (@JoseSamueldeMeloSantos) |

---

## 1. Tecnologias

- Spring Boot 3.4.5
- Thymeleaf
- Flyway (2 migrations)
- Spring Security
- Testcontainers

---

## 2. Análise Funcional

### Endpoints REST (9 mapeados)

| Método | Path | Arquivo |
|--------|------|---------|
| `GET` | `/login` | `AuthController.java` |
| `DELETE` | `/produtos/{id}` | `LivroController.java` |
| `GET` | `/produtos` | `LivroController.java` |
| `GET` | `/produtos/fragmento-tabela` | `LivroController.java` |
| `GET` | `/produtos/novo` | `LivroController.java` |
| `GET` | `/produtos/{id}/editar` | `LivroController.java` |
| `POST` | `/produtos` | `LivroController.java` |
| `PUT` | `/produtos/{id}` | `LivroController.java` |
| `GET` | `/ping` | `PingController.java` |

### Entidades / Tabelas (2 encontradas)

- `livro`
- `livro (via V1__criar_tabela_livro.sql)`

### Migrations (2 arquivos)

- `V1__criar_tabela_livro.sql`
- `V2__insert_livros.sql`

---

## 3. Análise Arquitetural

| Aspecto | Status | Observação |
|---------|--------|-----------|
| Arquitetura em camadas | ✅ | controller=✅  service=✅  repository=✅ |
| Testes automatizados | ✅ | 3 arquivo(s) de teste |
| Migrations versionadas | ✅ | 2 migration(s) |
| Logging | ❌ | não detectado |
| Autenticação / Segurança | ✅ | Spring Security / JWT / decorator detectado |
| DTOs / Separação de dados | ❌ | não detectado |
| Tratamento global de exceções | ✅ | @ControllerAdvice / @ExceptionHandler detectado |
| Documentação de API (OpenAPI) | ❌ | não detectado |
| Variáveis de ambiente | ❌ | não detectado |
| Dockerfile / docker-compose | ✅ | presente |

---

## 4. Contribuição por Usuário

### Resumo

| Usuário | Commits | % commits | Linhas adicionadas | Linhas no código atual | % código atual |
|---------|---------|-----------|-------------------|----------------------|----------------|
| Jose Samuel De Melo Santos (@JoseSamueldeMeloSantos) | 1 | 100% | 3.830 | 2.193 | 100% |

### Contribuição por Camada

| Camada | Total linhas | Jose Samuel De Melo Santos (@JoseSamueldeMeloSantos) |
|--------|-------------|---------|
| Controller | 1.171 | 100% |
| Repository | 68 | 100% |
| Service | 430 | 100% |

---

## 5. Contribuição por Funcionalidade

Baseado em `git blame` nos arquivos de controller e service.

| Arquivo | Total linhas | Jose Samuel De Melo Santos (@JoseSamueldeMeloSantos) |
|---------|-------------|---------|
| `form.html` | 181 | 100% |
| `ProdutoControllerTest.java` | 177 | 100% |
| `login.html` | 175 | 100% |
| `ProdutoServiceTest.java` | 171 | 100% |
| `LivroService.java` | 167 | 100% |
| `layout.html` | 149 | 100% |
| `LivroController.java` | 132 | 100% |
| `tabela.html` | 80 | 100% |
| `linha.html` | 76 | 100% |
| `lista.html` | 72 | 100% |
| `MercadoApplicationTests.java` | 52 | 100% |
| `AuthController.java` | 48 | 100% |
| `V2__insert_livros.sql` | 47 | 100% |
| `MercadoApplication.java` | 40 | 100% |
| `PingController.java` | 20 | 100% |
| `V1__criar_tabela_livro.sql` | 14 | 100% |

---

*Relatório gerado automaticamente em 2026-06-25.*
*Os dados de contribuição são baseados em `git log --numstat` (linhas adicionadas) e `git blame` (linhas no código atual), excluindo commits de merge.*