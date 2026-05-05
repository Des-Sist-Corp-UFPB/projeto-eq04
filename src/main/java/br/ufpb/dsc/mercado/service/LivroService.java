package br.ufpb.dsc.mercado.service;

import br.ufpb.dsc.mercado.domain.Livro;
import br.ufpb.dsc.mercado.dto.LivroForm;
import br.ufpb.dsc.mercado.exception.LivroNaoEncontradoException;
import br.ufpb.dsc.mercado.repository.LivroRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Serviço de negócio para operações relacionadas a {@link Livro}.
 *
 * <p><strong>O que é a camada de Service?</strong><br>
 * O Service é responsável pela lógica de negócio da aplicação. Ele fica entre o
 * Controller (que lida com HTTP) e o Repository (que acessa o banco).
 * Essa separação de responsabilidades segue o padrão de arquitetura em camadas:
 * <pre>
 *   Controller (HTTP) → Service (regras de negócio) → Repository (banco de dados)
 * </pre>
 *
 * <p><strong>{@code @Service}:</strong><br>
 * É uma especialização de {@code @Component}. Indica semanticamente que esta classe
 * contém lógica de negócio. O Spring a detecta no escaneamento de componentes.
 *
 * <p><strong>{@code @Transactional}:</strong><br>
 * Garante que operações de escrita (create, update, delete) sejam executadas dentro
 * de uma transação de banco de dados. Se ocorrer qualquer exceção em runtime, a
 * transação é automaticamente revertida (rollback), preservando a consistência dos dados.
 *
 * @author DSC - UFPB Campus IV
 */
@Service
// @Transactional(readOnly = true) como padrão da classe melhora performance em leituras,
// pois informa ao banco que não haverá escrita nesta transação.
@Transactional(readOnly = true)
public class LivroService {

    // Injeção de dependência via construtor — prática recomendada pelo Spring e mais testável
    private final LivroRepository livroRepository;

    /**
     * Construtor com injeção de dependência.
     *
     * <p>Quando há apenas um construtor, o {@code @Autowired} é opcional a partir do Spring 4.3.
     * A injeção via construtor é preferível à injeção via campo ({@code @Autowired} no campo)
     * porque torna as dependências explícitas e facilita os testes unitários com Mockito.
     *
     * @param livroRepository repositório JPA de livros
     */
    public LivroService(LivroRepository livroRepository) {
        this.livroRepository = livroRepository;
    }

    /**
     * Lista todos os livros com paginação.
     *
     * <p>Utiliza {@code @Transactional(readOnly = true)} herdado da classe,
     * otimizando a performance pois o banco sabe que não precisa rastrear mudanças.
     *
     * @param pageable configuração de página, tamanho e ordenação
     * @return página de livros
     */
    public Page<Livro> listar(Pageable pageable) {
        return livroRepository.findAll(pageable);
    }

    /**
     * Busca livros pelo título (parcial, sem distinção de maiúsculas/minúsculas).
     * Se a busca estiver vazia, retorna todos os livros.
     *
     * @param busca    texto para filtrar por título (pode ser nulo ou vazio)
     * @param pageable configuração de paginação
     * @return página de livros filtrados
     */
    public Page<Livro> buscar(String busca, Pageable pageable) {
        if (!StringUtils.hasText(busca)) {
            return livroRepository.findAll(pageable);
        }
        return livroRepository.findByTituloContainingIgnoreCase(busca.trim(), pageable);
    }

    /**
     * Busca um livro pelo seu ID.
     *
     * <p>{@code orElseThrow} é um método do {@code Optional<T>} que retorna o valor
     * se presente, ou lança a exceção fornecida caso contrário.
     *
     * @param id identificador do livro
     * @return livro encontrado
     * @throws LivroNaoEncontradoException se nenhum livro for encontrado com o ID informado
     */
    public Livro buscarPorId(Long id) {
        return livroRepository.findById(id)
                .orElseThrow(() -> new LivroNaoEncontradoException(id));
    }

    /**
     * Cria um novo livro a partir dos dados do formulário.
     *
     * <p>{@code @Transactional} (sem readOnly) garante que o INSERT seja
     * feito dentro de uma transação com rollback automático em caso de erro.
     *
     * @param form dados validados do formulário
     * @return livro criado e persistido com ID gerado
     */
    @Transactional
    public Livro criar(LivroForm form) {
        Livro livro = new Livro(
                form.titulo(),
                form.autor(),
                form.descricao(),
                form.preco(),
                form.anoPublicacao()
        );
        // O método save() do JpaRepository faz o INSERT e retorna a entidade com o ID gerado
        return livroRepository.save(livro);
    }

    /**
     * Atualiza os dados de um livro existente.
     *
     * <p>O padrão aqui é "buscar, modificar, salvar":
     * <ol>
     *   <li>Busca a entidade gerenciada pelo JPA.</li>
     *   <li>Modifica seus campos.</li>
     *   <li>O JPA detecta as mudanças automaticamente (dirty checking) e faz UPDATE ao final da transação.</li>
     * </ol>
     *
     * @param id   identificador do livro a ser atualizado
     * @param form novos dados validados
     * @return livro atualizado
     * @throws LivroNaoEncontradoException se o livro não existir
     */
    @Transactional
    public Livro atualizar(Long id, LivroForm form) {
        Livro livro = buscarPorId(id);
        livro.setTitulo(form.titulo());
        livro.setAutor(form.autor());
        livro.setDescricao(form.descricao());
        livro.setPreco(form.preco());
        livro.setAnoPublicacao(form.anoPublicacao());
        // Não precisa chamar save() explicitamente — o JPA (dirty checking) detecta a mudança
        // e executa o UPDATE automaticamente ao final da transação
        return livroRepository.save(livro);
    }

    /**
     * Exclui um livro pelo ID.
     *
     * <p>Verifica se o livro existe antes de excluir, lançando exceção amigável
     * em vez de deixar o banco retornar um erro genérico.
     *
     * @param id identificador do livro a ser excluído
     * @throws LivroNaoEncontradoException se o livro não existir
     */
    @Transactional
    public void excluir(Long id) {
        // Verifica existência para dar mensagem de erro clara
        if (!livroRepository.existsById(id)) {
            throw new LivroNaoEncontradoException(id);
        }
        livroRepository.deleteById(id);
    }
}