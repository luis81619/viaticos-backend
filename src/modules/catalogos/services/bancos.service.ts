import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Banco } from '../entities/banco.entity';
import { CreateBancoDto } from '../dto/banco/create-banco.dto';
import { UpdateBancoDto } from '../dto/banco/update-banco.dto';
import { FindBancosQueryDto } from '../dto/banco/find-bancos-query.dto';
import { BancoResponseDto } from '../dto/banco/banco-response.dto';

import { ErrorCode } from 'src/common/exceptions/error-codes';

@Injectable()
export class BancosService {
  constructor(
    @InjectRepository(Banco)
    private readonly bancoRepository: Repository<Banco>,
  ) {}

  // Obtiene bancos con paginación, filtros y ordenamiento.
  async findAll(query: FindBancosQueryDto) {
    const {
      page = 1,
      limit = 25,
      nombre,
      isActive,
      sortBy = 'nombre',
      sortOrder = 'ASC',
    } = query;

    const qb = this.bancoRepository.createQueryBuilder('banco');

    // Filtro por nombre, sin importar mayúsculas/minúsculas.
    if (nombre) {
      qb.andWhere(
        'LOWER(banco.nombre) LIKE LOWER(:nombre)',
        { nombre: `%${nombre.trim()}%` },
      );
    }

    // Filtro por estado activo/inactivo.
    if (isActive !== undefined) {
      qb.andWhere(
        'banco.isActive = :isActive',
        { isActive },
      );
    }

    // Ordenamiento y paginación.
    qb.orderBy(`banco.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [bancos, totalRecords] =
      await qb.getManyAndCount();

    const data = bancos.map((banco) =>
      this.toResponseDto(banco),
    );

    return {
      data,
      meta: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  // Busca un banco por ID.
  async findOne(
    id: string,
  ): Promise<BancoResponseDto> {
    const banco =
      await this.findBancoOrFail(id);

    return this.toResponseDto(banco);
  }

  // Crea un banco nuevo.
  async create( createBancoDto: CreateBancoDto, userId: string,): Promise<BancoResponseDto> {
    const banco = this.bancoRepository.create({
      ...createBancoDto,
      createdBy: userId,
    });

    const savedBanco =
      await this.bancoRepository.save(banco);

    return this.toResponseDto(savedBanco);
  }

  // Actualiza parcialmente un banco.
  async update(id: string, updateBancoDto: UpdateBancoDto, userId: string, ): Promise<BancoResponseDto> {
    const banco = await this.findEntityById(id);
    Object.assign(
      banco,
      updateBancoDto,
      {
        updatedBy: userId,
      },
    );

    const updatedBanco =
      await this.bancoRepository.save(banco);

    return this.toResponseDto(updatedBanco);
  }

  // Busca un banco o lanza error 404 si no existe.
  private async findBancoOrFail(
    id: string,
  ): Promise<Banco> {
    const banco =
      await this.bancoRepository.findOne({
        where: { id },
      });

    if (!banco) {
      throw new NotFoundException({
        error: {
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: 'Bank not found.',
          details: [],
        },
      });
    }

    return banco;
  }

  private async findEntityById(id: string): Promise<Banco> {
    const banco = await this.bancoRepository.findOne({
      where: { id },
    });

    if (!banco) {
      throw new NotFoundException({
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'Bank not found.',
        details: [],
      });
    }

    return banco;
  }

  // Convierte la entidad Banco al contrato público del API.
  private toResponseDto(
    banco: Banco,
  ): BancoResponseDto {
    return {
      id: banco.id,
      nombre: banco.nombre,
      isActive: banco.isActive,
      createdAt: banco.createdAt,
      updatedAt: banco.updatedAt,
    };
  }
}