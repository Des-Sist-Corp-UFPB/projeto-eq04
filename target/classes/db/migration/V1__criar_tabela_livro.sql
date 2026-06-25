CREATE TABLE livro (
    id BIGSERIAL PRIMARY KEY,

    titulo VARCHAR(120) NOT NULL,
    autor VARCHAR(150) NOT NULL,
    descricao TEXT,

    preco NUMERIC(10, 2) NOT NULL,

    ano_publicacao INTEGER,

    criado_em TIMESTAMP WITH TIME ZONE NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL
);