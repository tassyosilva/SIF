from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from ..database import Base
from sqlalchemy.exc import IntegrityError

class Estado(Base):
    __tablename__ = "estados"
    
    sigla = Column(String(2), primary_key=True)

    def __repr__(self):
        return f"<Estado(sigla={self.sigla})>"

    @classmethod
    def populate_default_estados(cls, db):
        estados = [
            'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
            'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
            'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
        ]
        
        for sigla in estados:
            if not db.query(cls).filter(cls.sigla == sigla).first():
                new_estado = cls(sigla=sigla)
                db.add(new_estado)
        
        try:
            db.commit()
            print(f"Estados populados: {len(estados)}")
        except IntegrityError:
            db.rollback()
            print("Erro ao popular estados")

class Orgao(Base):
    __tablename__ = "orgaos"
    
    id = Column(String(3), primary_key=True)
    nome = Column(String, nullable=False)

    def __repr__(self):
        return f"<Orgao(id={self.id}, nome={self.nome})>"

    @classmethod
    def populate_default_orgaos(cls, db):
        orgaos = [
            ('001', 'IDNET'),
            ('002', 'CACADOR'),
            ('003', 'PF'),
            ('004', 'PRF'),
            ('005', 'PFF'),
            ('006', 'PM'),
            ('007', 'PC'),
            ('008', 'PP'),
            ('009', 'GM'),
            ('010', 'SESP'),
            ('011', 'SEJUC'),
            ('012', 'MITRA'),
            ('013', 'DETRAN'),
            ('014', 'SIF')
        ]
        
        for codigo, nome in orgaos:
            if not db.query(cls).filter(cls.id == codigo).first():
                new_orgao = cls(id=codigo, nome=nome)
                db.add(new_orgao)
        
        try:
            db.commit()
        except IntegrityError:
            db.rollback()