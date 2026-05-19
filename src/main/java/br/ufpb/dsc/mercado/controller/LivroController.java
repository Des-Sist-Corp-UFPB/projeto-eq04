package br.ufpb.dsc.mercado.controller;

import br.ufpb.dsc.mercado.domain.Livro;
import br.ufpb.dsc.mercado.dto.LivroForm;
import br.ufpb.dsc.mercado.exception.LivroNaoEncontradoException;
import br.ufpb.dsc.mercado.service.LivroService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/produtos")
public class LivroController {

    private static final int TAMANHO_PAGINA = 10;
    private static final String HEADER_HTMX = "HX-Request";

    private final LivroService livroService;

    public LivroController(LivroService livroService) {
        this.livroService = livroService;
    }

    @GetMapping
    public String listar(
            @RequestParam(name = "busca", required = false, defaultValue = "") String busca,
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestHeader(value = HEADER_HTMX, required = false) String htmx,
            Model model) {

        PageRequest pageRequest = PageRequest.of(pagina, TAMANHO_PAGINA, Sort.by("titulo").ascending());
        Page<Livro> livros = livroService.buscar(busca, pageRequest);

        model.addAttribute("livros", livros);
        model.addAttribute("busca", busca);
        model.addAttribute("paginaAtual", pagina);

        if (htmx != null) {
            return "produtos/fragments/tabela :: tabela";
        }
        return "produtos/lista";
    }

    @GetMapping("/fragmento-tabela")
    public String fragmentoTabela(
            @RequestParam(name = "busca", required = false, defaultValue = "") String busca,
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            Model model) {

        PageRequest pageRequest = PageRequest.of(pagina, TAMANHO_PAGINA, Sort.by("titulo").ascending());
        Page<Livro> livros = livroService.buscar(busca, pageRequest);

        model.addAttribute("livros", livros);
        model.addAttribute("busca", busca);
        model.addAttribute("paginaAtual", pagina);

        return "produtos/fragments/tabela :: tabela";
    }

    @GetMapping("/novo")
    public String novoForm(Model model) {
        model.addAttribute("form", new LivroForm(null, null, null, null, null));
        model.addAttribute("livro", null);
        return "produtos/fragments/form :: modal";
    }

    @GetMapping("/{id}/editar")
    public String editarForm(@PathVariable Long id, Model model) {
        Livro livro = livroService.buscarPorId(id);
        LivroForm form = new LivroForm(
                livro.getTitulo(),
                livro.getAutor(),
                livro.getDescricao(),
                livro.getPreco(),
                livro.getAnoPublicacao()
        );
        model.addAttribute("form", form);
        model.addAttribute("livro", livro);
        return "produtos/fragments/form :: modal";
    }

    @PostMapping
    public String criar(
            @Valid @ModelAttribute("form") LivroForm form,
            BindingResult bindingResult,
            Model model) {

        if (bindingResult.hasErrors()) {
            model.addAttribute("livro", null);
            return "produtos/fragments/form :: modal";
        }

        Livro novoLivro = livroService.criar(form);
        model.addAttribute("livro", novoLivro);
        return "produtos/fragments/linha :: linha";
    }

    @PutMapping("/{id}")
    public String atualizar(
            @PathVariable Long id,
            @Valid @ModelAttribute("form") LivroForm form,
            BindingResult bindingResult,
            Model model) {

        if (bindingResult.hasErrors()) {
            Livro livro = livroService.buscarPorId(id);
            model.addAttribute("livro", livro);
            return "produtos/fragments/form :: modal";
        }

        Livro livroAtualizado = livroService.atualizar(id, form);
        model.addAttribute("livro", livroAtualizado);
        return "produtos/fragments/linha :: linha";
    }

    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        try {
            livroService.excluir(id);
            return ResponseEntity.ok().build();
        } catch (LivroNaoEncontradoException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
