import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid'

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(

    @InjectRepository(Product)
    private readonly producRepository: Repository<Product>,

  ) {}

  async create(createProductDto: CreateProductDto) {
    
    try {
      
      const product = this.producRepository.create(createProductDto)
      await this.producRepository.save( product );

      return product;

    } catch (error) {
      this.handleDBExceptions(error);
    }

  }

  async findAll( paginationDto: PaginationDto ) {
    
    const { limit = 10, offset = 0} = paginationDto;
    const products = await this.producRepository.find({
      take: limit,
      skip: offset,
    });

    return products;

  }

  async findOne(term: string) {

    let product: Product;
    
    if ( isUUID( term ) ) {
      product = await this.producRepository.findOneBy({id: term});
    } else {
      const queryBuilder = this.producRepository.createQueryBuilder();
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        }).getOne();
    }

    if ( !product )
      throw new NotFoundException(`Product ${term} not found`);

    return product;

  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    
    const product = await this.producRepository.preload({
      id: id,
      ...updateProductDto
    });

    if ( !product )
      throw new NotFoundException(`Product with id: ${id} not found`);

    try {
      await this.producRepository.save(product);
      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }

  }

  async remove(id: string) {

    const product = await this.findOne(id);

    await this.producRepository.remove( product );

  }

  private handleDBExceptions( error: any ) {

    if ( error.code === '23505' )
      throw new BadRequestException( error.detail );

    this.logger.error( error )
    throw new InternalServerErrorException('Unexpected error, check server logs');

  }

}
